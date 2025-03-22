// backend/routes/librarianRoutes.js

const express = require('express');
const router = express.Router();
const librarianController = require('../controllers/librarianController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Apply authentication and role middleware to all librarian routes
router.use(authMiddleware);
router.use(roleMiddleware('Librarian'));

// Add New Resource
router.post('/add-resource', librarianController.addResource);

// Update Resource
router.put('/update-resource/:id', librarianController.updateResource);

// Delete Resource
router.delete('/delete-resource/:id', librarianController.deleteResource);

// Manage Borrowing
router.put('/manage-borrowing/:id', librarianController.manageBorrowing);

// Track Inventory
router.get('/track-inventory', librarianController.trackInventory);

// Handle Reservations
router.put('/handle-reservation/:id', librarianController.handleReservation);

// Generate Reports
router.get('/generate-reports', librarianController.generateReports);

// Send Notifications
router.post('/send-notification', librarianController.sendNotification);

// Manage User Accounts
router.put('/manage-user/:id', librarianController.manageUser);

// Get All Users
router.get('/get-all-users', librarianController.getAllUsers);

// Create New User
router.post('/create-user', librarianController.createUser);

// Delete User Account
router.delete('/delete-user/:id', librarianController.deleteUser);

router.get('/get-resources', librarianController.getResources);

// Edit Resource
router.put('/edit-resource/:id', librarianController.editResource);
module.exports = router; // Ensure the router is exported directly
