// backend/controllers/authController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Register a new patron
exports.registerPatron = (req, res) => {
    const { username, email, password, first_name, last_name } = req.body;

    // Basic validation
    if (!username || !email || !password || !first_name || !last_name) {
        return res.status(400).json({ msg: 'Please enter all required fields.' });
    }

    // Check if user already exists
    const checkUserQuery = 'SELECT * FROM Users WHERE username = ? OR email = ?';
    db.query(checkUserQuery, [username, email], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            return res.status(400).json({ msg: 'Username or email already exists.' });
        }

        // Hash the password
        bcrypt.genSalt(10, (err, salt) => {
            if (err) throw err;

            bcrypt.hash(password, salt, (err, hash) => {
                if (err) throw err;

                // Insert new user
                const insertUserQuery = 'INSERT INTO Users (username, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)';
                db.query(insertUserQuery, [username, email, hash, first_name, last_name, 'Patron'], (err, result) => {
                    if (err) throw err;

                    res.status(201).json({ msg: 'Patron registered successfully.' });
                });
            });
        });
    });
};

// Login
exports.login = (req, res) => {
    const { username, password } = req.body;

    // Basic validation
    if (!username || !password) {
        return res.status(400).json({ msg: 'Please enter all required fields.' });
    }

    // Check if user exists
    const getUserQuery = 'SELECT * FROM Users WHERE username = ?';
    db.query(getUserQuery, [username], (err, results) => {
        if (err) throw err;

        if (results.length === 0) {
            return res.status(400).json({ msg: 'Invalid credentials.' });
        }

        const user = results[0];

        // Compare passwords
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;

            if (!isMatch) return res.status(400).json({ msg: 'Invalid credentials.' });

            // Create JWT
            jwt.sign(
                { user_id: user.user_id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: 3600 },
                (err, token) => {
                    if (err) throw err;
                    res.json({
                        token,
                        user: {
                            user_id: user.user_id,
                            username: user.username,
                            email: user.email,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            role: user.role
                        }
                    });
                }
            );
        });
    });
};
