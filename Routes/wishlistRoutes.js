const express = require('express');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  isInWishlist,
  getWishlistCount,
  moveWishlistToCart
} = require('../Controller/wishlistController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All wishlist routes require authentication
router.use(protect);

// Get all wishlist items for current user
router.get('/', getWishlist);

// Get wishlist count
router.get('/count', getWishlistCount);

// Check if product is in wishlist
router.get('/check/:productId', isInWishlist);

// Add product to wishlist
router.post('/add', addToWishlist);

// Remove product from wishlist
router.post('/remove', removeFromWishlist);

// Clear entire wishlist
router.delete('/clear', clearWishlist);

// Move wishlist items to cart
router.get('/move-to-cart', moveWishlistToCart);

module.exports = router;
