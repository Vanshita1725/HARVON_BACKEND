const Category = require('../Models/Category');

// Admin: create category
exports.createCategory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: admin only' });
    }

    const { name, description, isActive } = req.body || {};
    if (!name) return res.status(400).json({ success: false, message: 'Category name is required' });

    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ success: false, message: 'Category already exists' });

    const category = await Category.create({ name, description, isActive });
    return res.status(201).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: update category
exports.updateCategory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: admin only' });
    }

    const { id } = req.params;
    const { name, description, isActive } = req.body;

    // Validate id format
    if (!id || id.length !== 24) {
      return res.status(400).json({ success: false, message: 'Invalid category ID' });
    }

    // Find the category first
    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Check for duplicate name (if name is being updated and is different from current)
    if (name && name !== category.name) {
      const existing = await Category.findOne({ name });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Category name already exists' });
      }
    }

    // Update fields
    if (name) category.name = name;
    if (typeof description === 'string') category.description = description;
    if (typeof isActive === 'boolean') category.isActive = isActive;

    // Save the updated category
    const updatedCategory = await category.save();

    return res.status(200).json({ success: true, data: updatedCategory });
  } catch (error) {
    console.error('Update category error:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: delete category
exports.deleteCategory = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: admin only' });
    }

    const { id } = req.params;
    const category = await Category.findByIdAndDelete(id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });

    return res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: list all categories (including inactive)
exports.getCategoriesAdmin = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: admin only' });
    }

    const categories = await Category.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Public/user: list only active categories
exports.getCategoriesUser = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ name: 1 });
    return res.status(200).json({ success: true, data: categories });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Public/user: get category by id (only if active)
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findById(id);
    if (!category) return res.status(404).json({ success: false, message: 'Category not found' });
    if (!category.isActive) return res.status(404).json({ success: false, message: 'Category not found' });

    return res.status(200).json({ success: true, data: category });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
