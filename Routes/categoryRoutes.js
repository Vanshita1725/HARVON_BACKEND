const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const categoryController = require('../Controller/categoryController');

// Admin routes (protected)
router.post('/admin', protect, categoryController.createCategory);
router.put('/admin/:id', protect, categoryController.updateCategory);
router.delete('/admin/:id', protect, categoryController.deleteCategory);
router.get('/admin', protect, categoryController.getCategoriesAdmin);

// Public/user routes
router.get('/', categoryController.getCategoriesUser);
router.get('/:id', categoryController.getCategoryById);

module.exports = router;
