const Wishlist = require('../Models/Wishlist');
const Product = require('../Models/Product');

// Get all wishlist items for current user
exports.getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user._id })
      .populate({
        path: 'products.productId',
        select: 'name description price images category brand stock featured'
      });

    if (!wishlist) {
      return res.status(200).json({ 
        success: true, 
        message: 'Wishlist is empty',
        data: { products: [] }
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Wishlist retrieved successfully',
      data: wishlist
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching wishlist',
      error: error.message
    });
  }
};

// Add product to wishlist
exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found'
      });
    }

    // Find or create wishlist for user
    let wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      // Create new wishlist
      wishlist = new Wishlist({
        userId: req.user._id,
        products: [{ productId }]
      });
    } else {
      // Check if product already in wishlist
      const productExists = wishlist.products.some(
        item => item.productId.toString() === productId
      );

      if (productExists) {
        return res.status(400).json({ 
          success: false, 
          message: 'Product already in wishlist'
        });
      }

      // Add product to wishlist
      wishlist.products.push({ productId });
    }

    await wishlist.save();

    // Populate the response
    await wishlist.populate({
      path: 'products.productId',
      select: 'name description price images category brand stock featured'
    });

    res.status(200).json({ 
      success: true, 
      message: 'Product added to wishlist successfully',
      data: wishlist
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error adding to wishlist',
      error: error.message
    });
  }
};

// Remove product from wishlist
exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wishlist not found'
      });
    }

    // Find and remove product
    const productIndex = wishlist.products.findIndex(
      item => item.productId.toString() === productId
    );

    if (productIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found in wishlist'
      });
    }

    wishlist.products.splice(productIndex, 1);
    await wishlist.save();

    // Populate the response
    await wishlist.populate({
      path: 'products.productId',
      select: 'name description price images category brand stock featured'
    });

    res.status(200).json({ 
      success: true, 
      message: 'Product removed from wishlist successfully',
      data: wishlist
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error removing from wishlist',
      error: error.message
    });
  }
};

// Clear entire wishlist
exports.clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Wishlist not found'
      });
    }

    wishlist.products = [];
    await wishlist.save();

    res.status(200).json({ 
      success: true, 
      message: 'Wishlist cleared successfully',
      data: wishlist
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error clearing wishlist',
      error: error.message
    });
  }
};

// Check if product is in wishlist
exports.isInWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ userId: req.user._id });

    if (!wishlist) {
      return res.status(200).json({ 
        success: true, 
        data: { isInWishlist: false }
      });
    }

    const isInWishlist = wishlist.products.some(
      item => item.productId.toString() === productId
    );

    res.status(200).json({ 
      success: true, 
      data: { isInWishlist }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error checking wishlist',
      error: error.message
    });
  }
};

// Get wishlist count for current user
exports.getWishlistCount = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user._id });

    const count = wishlist ? wishlist.products.length : 0;

    res.status(200).json({ 
      success: true, 
      data: { count }
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error getting wishlist count',
      error: error.message
    });
  }
};

// Move all wishlist items to cart (if needed)
exports.moveWishlistToCart = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user._id })
      .populate({
        path: 'products.productId',
        select: 'name description price images category brand stock'
      });

    if (!wishlist || wishlist.products.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Wishlist is empty'
      });
    }

    res.status(200).json({ 
      success: true, 
      message: 'Ready to add to cart',
      data: wishlist.products
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error moving wishlist to cart',
      error: error.message
    });
  }
};
