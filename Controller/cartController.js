const Cart = require('../Models/Cart');
const Product = require('../Models/Product');

// Get user's cart
exports.getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate({
      path: 'items.productId',
      select: 'name description price images category brand stock featured'
    });

    if (!cart) {
      return res.status(200).json({ success: true, message: 'Cart is empty', data: { items: [] } });
    }

    res.status(200).json({ success: true, message: 'Cart retrieved successfully', data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching cart', error: error.message });
  }
};

// Add product to cart (or increase quantity)
exports.addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: 'productId is required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    let cart = await Cart.findOne({ userId: req.user._id });

    if (!cart) {
      cart = new Cart({ userId: req.user._id, items: [{ productId, quantity }] });
    } else {
      const existingIndex = cart.items.findIndex(i => i.productId.toString() === productId);
      if (existingIndex > -1) {
        cart.items[existingIndex].quantity += Number(quantity);
      } else {
        cart.items.push({ productId, quantity });
      }
    }

    await cart.save();
    await cart.populate({ path: 'items.productId', select: 'name description price images category brand stock featured' });

    res.status(200).json({ success: true, message: 'Product added to cart', data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error adding to cart', error: error.message });
  }
};

// Update quantity for an item
exports.updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    if (!productId || typeof quantity === 'undefined') {
      return res.status(400).json({ success: false, message: 'productId and quantity are required' });
    }

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(i => i.productId.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ success: false, message: 'Product not in cart' });

    if (Number(quantity) <= 0) {
      // remove item if quantity <= 0
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = Number(quantity);
    }

    await cart.save();
    await cart.populate({ path: 'items.productId', select: 'name description price images category brand stock featured' });

    res.status(200).json({ success: true, message: 'Cart updated', data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating cart', error: error.message });
  }
};

// Remove product from cart
exports.removeFromCart = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ success: false, message: 'productId is required' });

    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    const index = cart.items.findIndex(i => i.productId.toString() === productId);
    if (index === -1) return res.status(404).json({ success: false, message: 'Product not in cart' });

    cart.items.splice(index, 1);
    await cart.save();
    await cart.populate({ path: 'items.productId', select: 'name description price images category brand stock featured' });

    res.status(200).json({ success: true, message: 'Product removed from cart', data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error removing from cart', error: error.message });
  }
};

// Clear entire cart
exports.clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

    cart.items = [];
    await cart.save();

    res.status(200).json({ success: true, message: 'Cart cleared', data: cart });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error clearing cart', error: error.message });
  }
};

// Get cart item count (distinct items and total quantity)
exports.getCartCount = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart) return res.status(200).json({ success: true, data: { distinct: 0, totalQuantity: 0 } });

    const distinct = cart.items.length;
    const totalQuantity = cart.items.reduce((s, i) => s + (i.quantity || 0), 0);

    res.status(200).json({ success: true, data: { distinct, totalQuantity } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error getting cart count', error: error.message });
  }
};

// Get cart total price
exports.getCartTotal = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user._id }).populate({ path: 'items.productId', select: 'price' });
    if (!cart) return res.status(200).json({ success: true, data: { total: 0 } });

    const total = cart.items.reduce((sum, it) => {
      const price = it.productId && it.productId.price ? it.productId.price : 0;
      return sum + price * (it.quantity || 0);
    }, 0);

    res.status(200).json({ success: true, data: { total } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error getting cart total', error: error.message });
  }
};
