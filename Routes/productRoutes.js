const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { protect } = require('../middleware/auth');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} = require('../Controller/productController');

// Public
router.get('/', getProducts);
router.get('/:id', getProductById);

// Protected: create/update/delete
router.post('/', protect, upload.array('images', 6), createProduct);
router.put('/:id', protect, upload.array('images', 6), updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
