// backend/routes/patronRoutes.js

const express = require('express');
const router = express.Router();
const patronController = require('../controllers/patronController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const { body } = require('express-validator');

// Apply authentication and role middleware to all patron routes
router.use(authMiddleware);
router.use(roleMiddleware('Patron'));

// Search Catalog
router.get('/search', patronController.searchCatalog);

// Borrow Resource
router.post('/borrow', [
    body('resource_id').isInt().withMessage('Resource ID must be an integer.')
], patronController.borrowResource);

// Reserve Resource
router.post('/reserve', patronController.reserveResource);

// View Borrowing History
router.get('/borrow-history', patronController.borrowHistory);

// Receive Notifications
router.get('/notifications', patronController.getNotifications);

// Update Profile
router.put('/update-profile', patronController.updateProfile);

// Fetch Borrowed Books
router.get('/get-borrowed-books', patronController.getBorrowedBooks);

// Renew a Borrowing
router.put('/renew-borrowing/:borrowingId', patronController.renewBorrowing);
// Additional routes as needed

module.exports = router;
