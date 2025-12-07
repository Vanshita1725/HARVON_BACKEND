const Product = require('../Models/Product');
const Category = require('../Models/Category');
const path = require('path');
const fs = require('fs');

// CATEGORY HANDLERS
exports.createCategory = async (req, res) => {
  try {
    const { name, slug, description } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ success: false, message: 'Category already exists' });

    const category = await Category.create({ name, slug, description });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const updates = req.body || {};
    const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    res.status(200).json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    // Optional: prevent deletion if products belong to this category
    const linked = await Product.findOne({ category: category._id });
    if (linked) return res.status(400).json({ success: false, message: 'Category has linked products; delete or reassign them first' });

    // use deleteOne via model to avoid deprecated/removed Document.remove()
    await Category.findByIdAndDelete(category._id);
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PRODUCT HANDLERS
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, category, brand, sizes, colors, stock, featured } = req.body || {};

    if (!name || !price) return res.status(400).json({ success: false, message: 'Name and price are required' });

    const images = [];
    if (req.files && req.files.length) {
      req.files.forEach(f => images.push(`/uploads/${f.filename}`));
    }

    const sizesArr = typeof sizes === 'string' && sizes ? sizes.split(',').map(s => s.trim()) : (Array.isArray(sizes) ? sizes : []);
    const colorsArr = typeof colors === 'string' && colors ? colors.split(',').map(c => c.trim()) : (Array.isArray(colors) ? colors : []);

    const prod = await Product.create({
      name,
      description,
      price: Number(price),
      images,
      category: category || null,
      brand,
      sizes: sizesArr,
      colors: colorsArr,
      stock: stock ? Number(stock) : 0,
      featured: featured === 'true' || featured === true
    });

    res.status(201).json({ success: true, data: prod });
  } catch (error) {
    // cleanup uploaded files if creation fails
    if (req.files && req.files.length) {
      req.files.forEach(f => {
        const p = path.join(__dirname, '..', 'uploads', f.filename);
        fs.unlink(p, () => {});
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProducts = async (req, res) => {
  try {
    const { q, category, featured, limit = 20, page = 1 } = req.query || {};
    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (category) filter.category = category;
    if (featured === 'true') filter.featured = true;

    const skip = (Number(page) - 1) * Number(limit);
    const products = await Product.find(filter).populate('category').sort({ createdAt: -1 }).skip(skip).limit(Number(limit));
    res.status(200).json({ success: true, data: products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category');
    if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
    res.status(200).json({ success: true, data: product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const updates = req.body || {};
    const prod = await Product.findById(req.params.id);
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });

    // handle new uploaded images: delete old images and replace with new ones
    if (req.files && req.files.length) {
      // remove existing image files from disk
      if (prod.images && prod.images.length) {
        prod.images.forEach(img => {
          try {
            const filePath = path.join(__dirname, '..', img.replace(/^\//, ''));
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          } catch (err) {
            // ignore individual file delete errors
          }
        });
      }

      // replace images array with newly uploaded files
      const newImages = [];
      req.files.forEach(f => newImages.push(`/uploads/${f.filename}`));
      prod.images = newImages;
    }

    // basic fields
    ['name','description','price','category','brand','stock','featured'].forEach(key => {
      if (typeof updates[key] !== 'undefined') {
        prod[key] = (key === 'price' || key === 'stock') ? Number(updates[key]) : updates[key];
      }
    });

    // sizes/colors can be comma separated
    if (typeof updates.sizes !== 'undefined') prod.sizes = (typeof updates.sizes === 'string') ? updates.sizes.split(',').map(s=>s.trim()) : updates.sizes;
    if (typeof updates.colors !== 'undefined') prod.colors = (typeof updates.colors === 'string') ? updates.colors.split(',').map(s=>s.trim()) : updates.colors;

    await prod.save();
    res.status(200).json({ success: true, data: prod });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id);
    if (!prod) return res.status(404).json({ success: false, message: 'Product not found' });

    // delete image files
    if (prod.images && prod.images.length) {
      prod.images.forEach(img => {
        try {
          const filePath = path.join(__dirname, '..', img.replace(/^\//, ''));
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        } catch (err) {}
      });
    }

    // use model deletion method instead of deprecated Document.remove()
    await Product.findByIdAndDelete(prod._id);
    res.status(200).json({ success: true, message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
