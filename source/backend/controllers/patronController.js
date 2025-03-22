// backend/controllers/patronController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
// Search Catalog
exports.searchCatalog = (req, res) => {
    const { query } = req.query;

    const searchQuery = `
        SELECT resource_id, title, author, resource_type, isbn, available_copies, location
        FROM Resources
        WHERE title LIKE ? OR author LIKE ? OR isbn LIKE ?
    `;

    const searchTerm = `%${query}%`;
    db.query(searchQuery, [searchTerm, searchTerm, searchTerm], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
};

exports.borrowResource = async (req, res) => {
  // Validate input
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
  }

  const { resource_id } = req.body;
  const user_id = req.user.user_id; // Assumes authMiddleware adds user info to req

  try {
      // Check if resource exists and is available
      const [resourceRows] = await db.promise().query(
          'SELECT * FROM Resources WHERE resource_id = ?',
          [resource_id]
      );

      if (resourceRows.length === 0) {
          return res.status(404).json({ msg: 'Resource not found.' });
      }

      const resource = resourceRows[0];

      if (resource.available_copies < 1) {
          return res.status(400).json({ msg: 'No available copies for this resource.' });
      }

      // Create borrowing record
      const borrow_date = new Date();
      const due_date = new Date();
      due_date.setDate(borrow_date.getDate() + 14); // 2 weeks loan period

      await db.promise().query(
          'INSERT INTO Borrowings (user_id, resource_id, borrow_date, due_date, status) VALUES (?, ?, ?, ?, ?)',
          [user_id, resource_id, borrow_date.toISOString().split('T')[0], due_date.toISOString().split('T')[0], 'Borrowed']
      );

      // Update available copies
      await db.promise().query(
          'UPDATE Resources SET available_copies = available_copies - 1 WHERE resource_id = ?',
          [resource_id]
      );

      res.status(200).json({ msg: 'Resource borrowed successfully.', due_date: due_date.toISOString().split('T')[0] });
  } catch (err) {
      console.error('Error borrowing resource:', err.message);
      res.status(500).json({ msg: 'Server error.' });
  }
};

// Reserve Resource
exports.reserveResource = (req, res) => {
    const { resource_id } = req.body;
    const user_id = req.user.user_id;

    if (!resource_id) {
        return res.status(400).json({ msg: 'Please provide resource_id.' });
    }

    // Check if resource exists
    const checkResourceQuery = 'SELECT * FROM Resources WHERE resource_id = ?';
    db.query(checkResourceQuery, [resource_id], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.status(404).json({ msg: 'Resource not found.' });
        }

        // Check if resource is available
        if (results[0].available_copies > 0) {
            return res.status(400).json({ msg: 'Resource is available. You can borrow it instead of reserving.' });
        }

        // Check if user already has a reservation
        const checkExistingReservationQuery = 'SELECT * FROM Reservations WHERE user_id = ? AND resource_id = ? AND status = "Reserved"';
        db.query(checkExistingReservationQuery, [user_id, resource_id], (err, resResults) => {
            if (err) throw err;

            if (resResults.length > 0) {
                return res.status(400).json({ msg: 'You have already reserved this resource.' });
            }

            // Insert reservation
            const insertReservationQuery = 'INSERT INTO Reservations (user_id, resource_id, reservation_date, status) VALUES (?, ?, ?, ?)';
            db.query(insertReservationQuery, [user_id, resource_id, new Date().toISOString().split('T')[0], 'Reserved'], (err, result) => {
                if (err) throw err;
                res.status(201).json({ msg: 'Resource reserved successfully.', reservation_id: result.insertId });
            });
        });
    });
};

exports.getBorrowedBooks = async (req, res) => {
    try {
        console.log('getBorrowedBooks endpoint called.');
        console.log('Request User:', req.user);

        // Extract user ID from the JWT payload
        const userId = req.user && req.user.user_id;
        console.log('Extracted User ID:', userId);

        if (!userId) {
            console.error('User ID is undefined or null.');
            return res.status(400).json({ msg: 'Invalid user ID.' });
        }

        const getBorrowedBooksQuery = `
            SELECT 
                b.borrowing_id,
                r.title,
                r.author,
                r.isbn,
                r.resource_type,
                b.borrow_date,
                b.due_date,
                b.status,
                b.renewals
            FROM 
                Borrowings b
            JOIN 
                Resources r ON b.resource_id = r.resource_id
            WHERE 
                b.user_id = ? AND b.status = 'Borrowed'
        `;

        // Execute the query using promise-based interface
        const [results] = await db.promise().query(getBorrowedBooksQuery, [userId]);
        console.log(`Fetched ${results.length} borrowed books for user ID ${userId}.`);

        res.json(results);
    } catch (err) {
        console.error('Error in getBorrowedBooks:', err);
        res.status(500).json({ msg: 'Server error while fetching borrowed books.' });
    }
};
// Import necessary modules

const dayjs = require('dayjs'); // For date manipulation

exports.renewBorrowing = (req, res) => {
    const borrowingId = req.params.borrowingId;
    const userId = req.user.user_id;

    // Define maximum renewals allowed
    const MAX_RENEWALS = 2;

    // Define renewal period (e.g., extend due_date by 14 days)
    const RENEWAL_PERIOD_DAYS = 14;

    // Fetch the borrowing record without unused fields
    const fetchBorrowingQuery = `
        SELECT 
            b.borrowing_id,
            b.due_date,
            b.renewals
        FROM 
            Borrowings b
        WHERE 
            b.borrowing_id = ? AND b.user_id = ? AND b.status = 'Borrowed'
    `;

    db.query(fetchBorrowingQuery, [borrowingId, userId], (err, results) => {
        if (err) {
            console.error('Error fetching borrowing record:', err);
            return res.status(500).json({ msg: 'Server error while processing renewal.' });
        }

        if (results.length === 0) {
            return res.status(404).json({ msg: 'Borrowing record not found or already returned.' });
        }

        const borrowing = results[0];

        // Check if maximum renewals have been reached
        if (borrowing.renewals >= MAX_RENEWALS) {
            return res.status(400).json({ msg: `Maximum renewals (${MAX_RENEWALS}) reached.` });
        }

        // Check if the book is overdue
        const today = dayjs().startOf('day');
        const dueDate = dayjs(borrowing.due_date);

        if (today.isAfter(dueDate)) {
            return res.status(400).json({ msg: 'Cannot renew an overdue book.' });
        }

        // Calculate new due date
        const newDueDate = dueDate.add(RENEWAL_PERIOD_DAYS, 'day').format('YYYY-MM-DD');

        // Update the borrowing record with the new due date and increment renewals
        const updateBorrowingQuery = `
            UPDATE 
                Borrowings 
            SET 
                due_date = ?, 
                renewals = renewals + 1,
                updated_at = CURRENT_TIMESTAMP
            WHERE 
                borrowing_id = ? AND user_id = ?
        `;

        db.query(updateBorrowingQuery, [newDueDate, borrowingId, userId], (err, updateResult) => {
            if (err) {
                console.error('Error updating borrowing record:', err);
                return res.status(500).json({ msg: 'Server error while renewing borrowing.' });
            }

            if (updateResult.affectedRows === 0) {
                return res.status(500).json({ msg: 'Failed to renew the borrowing record.' });
            }

            res.json({ 
                msg: 'Borrowing renewed successfully.', 
                new_due_date: newDueDate,
                renewals: borrowing.renewals + 1
            });
        });
    });
};


// View Borrowing History
exports.borrowHistory = (req, res) => {
    const user_id = req.user.user_id;

    const historyQuery = `
        SELECT r.title, b.borrow_date, b.due_date, b.return_date, b.status
        FROM Borrowings b
        JOIN Resources r ON b.resource_id = r.resource_id
        WHERE b.user_id = ?
        ORDER BY b.borrow_date DESC
    `;

    db.query(historyQuery, [user_id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
};

// // Renew Borrowals
// exports.renewBorrowal = (req, res) => {
//     const borrowing_id = req.params.id;
//     const user_id = req.user.user_id;

//     // Check if borrowing exists and is eligible for renewal
//     const checkBorrowingQuery = 'SELECT * FROM Borrowings WHERE borrowing_id = ? AND user_id = ? AND status = "Borrowed"';
//     db.query(checkBorrowingQuery, [borrowing_id, user_id], (err, results) => {
//         if (err) throw err;

//         if (results.length === 0) {
//             return res.status(404).json({ msg: 'Borrowing record not found or not eligible for renewal.' });
//         }

//         // Update due_date (extend by 14 days)
//         const newDueDate = new Date(results[0].due_date);
//         newDueDate.setDate(newDueDate.getDate() + 14);

//         const updateDueDateQuery = 'UPDATE Borrowings SET due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE borrowing_id = ?';
//         db.query(updateDueDateQuery, [newDueDate.toISOString().split('T')[0], borrowing_id], (err, result) => {
//             if (err) throw err;
//             res.json({ msg: 'Borrowing renewed successfully.', new_due_date: newDueDate.toISOString().split('T')[0] });
//         });
//     });
// };

// Receive Notifications
exports.getNotifications = (req, res) => {
    const user_id = req.user.user_id;

    const notificationsQuery = `
        SELECT notification_id, message, is_read, created_at
        FROM Notifications
        WHERE user_id = ?
        ORDER BY created_at DESC
    `;

    db.query(notificationsQuery, [user_id], (err, results) => {
        if (err) throw err;
        res.json(results);
    });
};

// Update Profile
exports.updateProfile = (req, res) => {
    const user_id = req.user.user_id;
    const { email, password, first_name, last_name, phone, address } = req.body;

    let updateFields = 'email = ?, first_name = ?, last_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [email, first_name, last_name, phone, address, user_id];

    if (password) {
        // Hash the new password
        bcrypt.genSalt(10, (err, salt) => {
            if (err) throw err;

            bcrypt.hash(password, salt, (err, hash) => {
                if (err) throw err;

                updateFields += ', password = ?';
                params.splice(5, 0, hash); // Insert hash before user_id
                const updateProfileQuery = `UPDATE Users SET ${updateFields} WHERE user_id = ?`;

                db.query(updateProfileQuery, params, (err, result) => {
                    if (err) throw err;
                    res.json({ msg: 'Profile updated successfully.' });
                });
            });
        });
    } else {
        const updateProfileQuery = `UPDATE Users SET ${updateFields} WHERE user_id = ?`;

        db.query(updateProfileQuery, params, (err, result) => {
            if (err) throw err;
            res.json({ msg: 'Profile updated successfully.' });
        });
    }
};
