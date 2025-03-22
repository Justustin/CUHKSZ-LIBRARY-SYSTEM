// backend/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Register a new patron
router.post('/register', authController.registerPatron);

// Login
router.post('/login', authController.login);

module.exports = router;
