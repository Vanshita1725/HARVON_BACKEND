const express = require('express');
const router = express.Router();
const { createCategory, getCategories, getCategoryById, updateCategory, deleteCategory } = require('../Controller/productController');
const { protect } = require('../middleware/auth');

// Public
router.get('/', getCategories);
router.get('/:id', getCategoryById);

// Protected (admin or authenticated users)
router.post('/', protect, createCategory);
router.put('/:id', protect, updateCategory);
router.delete('/:id', protect, deleteCategory);

module.exports = router;
