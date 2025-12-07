const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartCount,
  getCartTotal
} = require('../Controller/cartController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Get cart
router.get('/', getCart);

// Add to cart
router.post('/add', addToCart);

// Update item quantity
router.put('/update', updateCartItem);

// Remove item
router.post('/remove', removeFromCart);

// Clear cart
router.delete('/clear', clearCart);

// Get count
router.get('/count', getCartCount);

// Get total
router.get('/total', getCartTotal);

module.exports = router;
