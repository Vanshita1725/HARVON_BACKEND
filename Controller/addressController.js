const Address = require('../Models/Address');
const User = require('../Models/User');

// Create address (attached to authenticated user)
exports.createAddress = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const {
      label,
      recipientName,
      phone,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault
    } = req.body || {};

    // If setting this address as default, unset others for this user
    if (isDefault === 'true' || isDefault === true) {
      await Address.updateMany({ user: userId, isDefault: true }, { isDefault: false });
    }

    const address = await Address.create({
      user: userId,
      label,
      recipientName,
      phone,
      street,
      city,
      state,
      postalCode,
      country,
      isDefault: isDefault === 'true' || isDefault === true
    });

    res.status(201).json({ success: true, data: address });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get addresses belonging to authenticated user. Admins can request all with ?all=true
exports.getAddresses = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';

    const { all } = req.query || {};
    let filter = {};
    if (isAdmin && all === 'true') {
      filter = {}; // no filter -> all addresses
    } else {
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      filter = { user: userId };
    }

    const addresses = await Address.find(filter).sort({ isDefault: -1, createdAt: -1 });
    res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get single address by id (ensure owner or admin)
exports.getAddressById = async (req, res) => {
  try {
    const addr = await Address.findById(req.params.id);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });

    const userId = req.user && req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin && addr.user.toString() !== userId) return res.status(403).json({ success: false, message: 'Forbidden' });

    res.status(200).json({ success: true, data: addr });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update address (owner or admin)
exports.updateAddress = async (req, res) => {
  try {
    const addr = await Address.findById(req.params.id);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });

    const userId = req.user && req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin && addr.user.toString() !== userId) return res.status(403).json({ success: false, message: 'Forbidden' });

    const updates = req.body || {};

    // if setting default, unset other defaults for user
    if (typeof updates.isDefault !== 'undefined' && (updates.isDefault === 'true' || updates.isDefault === true)) {
      await Address.updateMany({ user: addr.user, isDefault: true }, { isDefault: false });
    }

    Object.keys(updates).forEach(k => {
      if (k in addr) {
        // convert booleans and keep strings as-is
        if (k === 'isDefault') addr[k] = (updates[k] === 'true' || updates[k] === true);
        else addr[k] = updates[k];
      }
    });

    await addr.save();
    res.status(200).json({ success: true, data: addr });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete address (owner or admin)
exports.deleteAddress = async (req, res) => {
  try {
    const addr = await Address.findById(req.params.id);
    if (!addr) return res.status(404).json({ success: false, message: 'Address not found' });

    const userId = req.user && req.user.id;
    const isAdmin = req.user && req.user.role === 'admin';
    if (!isAdmin && addr.user.toString() !== userId) return res.status(403).json({ success: false, message: 'Forbidden' });

    await Address.findByIdAndDelete(addr._id);
    res.status(200).json({ success: true, message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
