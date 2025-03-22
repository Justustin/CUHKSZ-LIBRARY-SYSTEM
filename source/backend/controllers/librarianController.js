// backend/controllers/librarianController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Add New Resource
exports.addResource = (req, res) => {
    const { title, author, isbn, resource_type, total_copies, available_copies, location } = req.body;

    // Basic validation
    if (!title || !author || !resource_type || !location) {
        return res.status(400).json({ msg: 'Please enter all required fields.' });
    }

    const insertResourceQuery = 'INSERT INTO Resources (title, author, isbn, resource_type, total_copies, available_copies, location) VALUES (?, ?, ?, ?, ?, ?, ?)';
    db.query(
        insertResourceQuery, 
        [title, author, isbn, resource_type, total_copies || 1, available_copies || (total_copies || 1), location], 
        (err, result) => {
            if (err) {
                console.error('Error adding resource:', err);
                return res.status(500).json({ msg: 'Server error while adding resource.' });
            }
            res.status(201).json({ msg: 'Resource added successfully.' });
        }
    );
};


// Update Resource
exports.updateResource = (req, res) => {
    const resourceId = req.params.id;
    const { title, author, isbn, resource_type, total_copies, available_copies, location } = req.body;

    const updateResourceQuery = 'UPDATE Resources SET title = ?, author = ?, isbn = ?, resource_type = ?, total_copies = ?, available_copies = ?, location = ?, updated_at = CURRENT_TIMESTAMP WHERE resource_id = ?';
    db.query(updateResourceQuery, [title, author, isbn, resource_type, total_copies, available_copies, location, resourceId], (err, result) => {
        if (err) throw err;
        res.json({ msg: 'Resource updated successfully.' });
    });
};

// Delete Resource
exports.deleteResource = (req, res) => {
    const resourceId = req.params.id;

    const deleteResourceQuery = 'DELETE FROM Resources WHERE resource_id = ?';
    db.query(deleteResourceQuery, [resourceId], (err, result) => {
        if (err) throw err;
        res.json({ msg: 'Resource deleted successfully.' });
    });
};
// Edit Resource
exports.editResource = (req, res) => {
    const resourceId = req.params.id;
    const { title, author, isbn, resource_type, total_copies, available_copies, location } = req.body;

    // Basic validation
    if (!title || !author || !resource_type || !location) {
        console.warn('Edit Resource: Missing required fields.');
        return res.status(400).json({ msg: 'Please enter all required fields.' });
    }

    // Additional validation for copies
    if (isNaN(total_copies) || total_copies < 0 || isNaN(available_copies) || available_copies < 0) {
        console.warn('Edit Resource: Invalid copies provided.');
        return res.status(400).json({ msg: 'Copies must be positive integers.' });
    }

    // Validation: available_copies should not exceed total_copies
    if (available_copies > total_copies) {
        console.warn('Edit Resource: Available copies exceed total copies.');
        return res.status(400).json({ msg: 'Available copies cannot exceed total copies.' });
    }

    const updateResourceQuery = `
        UPDATE Resources 
        SET title = ?, author = ?, isbn = ?, resource_type = ?, total_copies = ?, available_copies = ?, location = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE resource_id = ?
    `;

    db.query(
        updateResourceQuery,
        [title, author, isbn, resource_type, total_copies, available_copies, location, resourceId],
        (err, result) => {
            if (err) {
                console.error('Error editing resource:', err);
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({ msg: 'A resource with this ISBN already exists.' });
                }
                return res.status(500).json({ msg: 'Server error while editing resource.' });
            }

            if (result.affectedRows === 0) {
                console.warn(`Edit Resource: Resource with ID ${resourceId} not found.`);
                return res.status(404).json({ msg: 'Resource not found.' });
            }

            console.log(`Resource with ID ${resourceId} updated successfully.`);
            res.json({ msg: 'Resource updated successfully.' });
        }
    );
};

// Manage Borrowing
exports.manageBorrowing = (req, res) => {
    const borrowingId = req.params.id;
    const { status, due_date } = req.body;

    const updateBorrowingQuery = 'UPDATE Borrowings SET status = ?, due_date = ?, updated_at = CURRENT_TIMESTAMP WHERE borrowing_id = ?';
    db.query(updateBorrowingQuery, [status, due_date, borrowingId], (err, result) => {
        if (err) throw err;
        res.json({ msg: 'Borrowing status updated successfully.' });
    });
};

// Track Inventory
exports.trackInventory = (req, res) => {
    const trackInventoryQuery = 'SELECT resource_id, title, resource_type, total_copies, available_copies FROM Resources';
    db.query(trackInventoryQuery, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
};

// Handle Reservations
exports.handleReservation = (req, res) => {
    const reservationId = req.params.id;
    const { status } = req.body;

    const updateReservationQuery = 'UPDATE Reservations SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE reservation_id = ?';
    db.query(updateReservationQuery, [status, reservationId], (err, result) => {
        if (err) throw err;
        res.json({ msg: 'Reservation status updated successfully.' });
    });
};

// Generate Reports
exports.generateReports = (req, res) => {
    // Example: Inventory Report
    const inventoryReportQuery = 'SELECT title, resource_type, total_copies, available_copies FROM Resources';
    db.query(inventoryReportQuery, (err, results) => {
        if (err) throw err;
        res.json({ inventory_report: results });
    });
};

// Send Notifications
exports.sendNotification = (req, res) => {
    const { user_id, message } = req.body;

    if (!user_id || !message) {
        return res.status(400).json({ msg: 'Please provide user_id and message.' });
    }

    const insertNotificationQuery = 'INSERT INTO Notifications (user_id, message, is_read) VALUES (?, ?, FALSE)';
    db.query(insertNotificationQuery, [user_id, message], (err, result) => {
        if (err) throw err;
        res.status(201).json({ msg: 'Notification sent successfully.' });
    });
};

// Manage (Update) User Accounts
exports.manageUser = (req, res) => {
    const userId = req.params.id;
    const { username, email, password, first_name, last_name, role } = req.body;

    // Basic validation
    if (!username || !email || !first_name || !last_name || !role) {
        console.warn('Manage User: Missing required fields.');
        return res.status(400).json({ msg: 'Please enter all required fields.' });
    }

    // Validate role
    const validRoles = ['Librarian', 'User', 'Admin']; // Adjust roles as per your system
    if (!validRoles.includes(role)) {
        console.warn(`Manage User: Invalid role '${role}' provided.`);
        return res.status(400).json({ msg: `Role must be one of the following: ${validRoles.join(', ')}.` });
    }

    // Initialize query parameters
    let updateFields = 'username = ?, email = ?, first_name = ?, last_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP';
    let params = [username, email, first_name, last_name, role, userId];

    // Function to execute the update query
    const executeUpdate = (queryParams) => {
        const updateUserQuery = `UPDATE Users SET ${updateFields} WHERE user_id = ?`;

        db.query(updateUserQuery, queryParams, (err, result) => {
            if (err) {
                console.error('Error updating user:', err);
                return res.status(500).json({ msg: 'Server error while updating user.' });
            }
            if (result.affectedRows === 0) {
                console.warn(`Manage User: User with ID ${userId} not found.`);
                return res.status(404).json({ msg: 'User not found.' });
            }
            console.log(`User with ID ${userId} updated successfully.`);
            res.json({ msg: 'User account updated successfully.' });
        });
    };

    if (password) {
        // Hash the new password
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                console.error('Error generating salt for password hashing:', err);
                return res.status(500).json({ msg: 'Server error while updating user.' });
            }

            bcrypt.hash(password, salt, (err, hash) => {
                if (err) {
                    console.error('Error hashing password:', err);
                    return res.status(500).json({ msg: 'Server error while updating user.' });
                }

                // Append password to updateFields and params
                const updatedFields = `${updateFields}, password = ?`;
                const updatedParams = [username, email, first_name, last_name, role, hash, userId];
                const updateUserQuery = `UPDATE Users SET ${updatedFields} WHERE user_id = ?`;

                db.query(updateUserQuery, updatedParams, (err, result) => {
                    if (err) {
                        console.error('Error updating user with password:', err);
                        return res.status(500).json({ msg: 'Server error while updating user.' });
                    }
                    if (result.affectedRows === 0) {
                        console.warn(`Manage User: User with ID ${userId} not found.`);
                        return res.status(404).json({ msg: 'User not found.' });
                    }
                    console.log(`User with ID ${userId} updated successfully with new password.`);
                    res.json({ msg: 'User account updated successfully.' });
                });
            });
        });
    } else {
        // No password update
        executeUpdate(params);
    }
};

exports.getResources = (req, res) => {
  const getResourcesQuery = 'SELECT * FROM Resources';
  db.query(getResourcesQuery, (err, results) => {
      if (err) {
          console.error('Error fetching resources:', err);
          return res.status(500).json({ msg: 'Server error while fetching resources.' });
      }
      res.json(results);
  });
};

// backend/controllers/librarianController.js

// Get All Users
exports.getAllUsers = (req, res) => {
    const getUsersQuery = 'SELECT user_id, username, email, first_name, last_name, role, created_at, updated_at FROM Users';
    db.query(getUsersQuery, (err, results) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ msg: 'Server error while fetching users.' });
        }
        console.log('All users fetched successfully.');
        res.json(results);
    });
};

// Create New User
exports.createUser = (req, res) => {
    const { username, email, password, first_name, last_name, role } = req.body;

    // Basic validation
    if (!username || !email || !password || !first_name || !last_name || !role) {
        console.warn('Create User: Missing required fields.');
        return res.status(400).json({ msg: 'Please enter all required fields.' });
    }

    // Check if role is valid
    const validRoles = ['Librarian', 'User', 'Admin']; // Adjust roles as per your system
    if (!validRoles.includes(role)) {
        console.warn(`Create User: Invalid role '${role}' provided.`);
        return res.status(400).json({ msg: `Role must be one of the following: ${validRoles.join(', ')}.` });
    }

    // Check if email already exists
    const checkEmailQuery = 'SELECT * FROM Users WHERE email = ?';
    db.query(checkEmailQuery, [email], (err, results) => {
        if (err) {
            console.error('Error checking existing email:', err);
            return res.status(500).json({ msg: 'Server error while checking email.' });
        }

        if (results.length > 0) {
            console.warn(`Create User: Email '${email}' already exists.`);
            return res.status(400).json({ msg: 'A user with this email already exists.' });
        }

        // Hash the password
        bcrypt.genSalt(10, (err, salt) => {
            if (err) {
                console.error('Error generating salt for password hashing:', err);
                return res.status(500).json({ msg: 'Server error while creating user.' });
            }

            bcrypt.hash(password, salt, (err, hash) => {
                if (err) {
                    console.error('Error hashing password:', err);
                    return res.status(500).json({ msg: 'Server error while creating user.' });
                }

                // Insert new user into the database
                const insertUserQuery = 'INSERT INTO Users (username, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)';
                db.query(insertUserQuery, [username, email, hash, first_name, last_name, role], (err, result) => {
                    if (err) {
                        console.error('Error creating new user:', err);
                        return res.status(500).json({ msg: 'Server error while creating user.' });
                    }
                    console.log(`New user created successfully with ID ${result.insertId}.`);
                    res.status(201).json({ msg: 'User account created successfully.' });
                });
            });
        });
    });
};
// backend/controllers/librarianController.js

// Delete User Account
exports.deleteUser = (req, res) => {
    const userId = req.params.id;

    const deleteUserQuery = 'DELETE FROM Users WHERE user_id = ?';
    db.query(deleteUserQuery, [userId], (err, result) => {
        if (err) {
            console.error('Error deleting user:', err);
            return res.status(500).json({ msg: 'Server error while deleting user.' });
        }
        if (result.affectedRows === 0) {
            console.warn(`Delete User: User with ID ${userId} not found.`);
            return res.status(404).json({ msg: 'User not found.' });
        }
        console.log(`User with ID ${userId} deleted successfully.`);
        res.json({ msg: 'User account deleted successfully.' });
    });
};

