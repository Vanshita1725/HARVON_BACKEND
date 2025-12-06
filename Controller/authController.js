const User = require('../Models/User');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const otpUtil = require('../utils/otp');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

// Helper to build absolute profile photo URL or fallback to static default
const buildProfilePhotoUrl = (req, profilePhotoPath) => {
  const host = req && req.get ? req.get('host') : process.env.HOST || 'localhost:5000';
  const protocol = req && req.protocol ? req.protocol : 'http';

  if (profilePhotoPath) {
    // profilePhotoPath is stored like '/uploads/filename.ext'
    return `${protocol}://${host}${profilePhotoPath}`;
  }

  // fallback to a static image in public/profile
  return `${protocol}://${host}/public/profile/staticprofile.jpeg`;
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phoneNumber } = req.body || {};

    if (!req.body || (Object.keys(req.body).length === 0 && !req.file)) {
      console.error('Register: missing or invalid body. Headers:', req.headers);
      console.error('Register: rawBody:', req.rawBody);
      return res.status(400).json({ success: false, message: 'Request body is missing or invalid JSON' });
    }

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email and password' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    let profilePhoto = null;
    if (req.file) {
      profilePhoto = `/uploads/${req.file.filename}`;
    }

    user = await User.create({
      name,
      email,
      password,
      phoneNumber,
      profilePhoto
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      token,
      message: 'User registered successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePhoto: buildProfilePhotoUrl(req, user.profilePhoto)
      }
    });
  } catch (error) {
    if (req.file) {
      const fs = require('fs');
      const filePath = req.file.path;
      fs.unlink(filePath, (err) => {
        if (err) console.error('Error deleting file:', err);
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password, phoneNumber, phone, identifier } = req.body || {};

    if (!req.body || Object.keys(req.body).length === 0) {
      console.error('Login: missing or invalid body. Headers:', req.headers);
      console.error('Login: rawBody:', req.rawBody);
      return res.status(400).json({ success: false, message: 'Request body is missing or invalid JSON' });
    }
    // Accept either email or phone (keys allowed: `identifier`, `email`, `phoneNumber`, `phone`)
    const rawId = identifier || email || phoneNumber || phone;
    const id = rawId ? rawId.toString().trim() : '';

    if (!id || !password) {
      return res.status(400).json({ success: false, message: 'Please provide an email or phone number and password' });
    }

    let user;

    // If id contains @ treat as email, otherwise treat as phone number
    if (/@/.test(id)) {
      user = await User.findOne({ email: id }).select('+password');
    } else {
      // Normalize basic phone input by removing spaces
      const phoneLookup = id.replace(/\s+/g, '');
      user = await User.findOne({ phoneNumber: phoneLookup }).select('+password');
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      token,
      message: 'Login successful',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePhoto: buildProfilePhotoUrl(req, user.profilePhoto)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send OTP to a phone number (public). Frontend should call this before registration or verification.
exports.sendOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body || {};
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'phoneNumber is required' });

    const result = await otpUtil.sendOtp(phoneNumber, { ttl: 5 * 60 * 1000 });

    const response = { success: true, message: 'OTP sent' };
    if (result.OTP) response.OTP = result.OTP;

    return res.status(200).json(response);
  } catch (error) {
    console.error('sendOtp error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// Verify OTP for a phone number
exports.verifyOtp = async (req, res) => {
  try {
    const { phoneNumber, code } = req.body || {};
    if (!phoneNumber || !code) return res.status(400).json({ success: false, message: 'phoneNumber and code are required' });

    const result = otpUtil.verifyOtp(phoneNumber, code);
    if (!result.success) return res.status(400).json({ success: false, message: result.message });

    return res.status(200).json({ success: true, message: 'OTP verified' });
  } catch (error) {
    console.error('verifyOtp error:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};


exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePhoto: buildProfilePhotoUrl(req, user.profilePhoto),
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+password');

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, phoneNumber, password } = req.body || {};

    if (name) user.name = name;
    if (email) user.email = email;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (password) user.password = password;

    // Handle profile photo upload
    if (req.file) {
      // Delete previous photo file if exists
      if (user.profilePhoto) {
        try {
          const oldPath = path.join(__dirname, '..', user.profilePhoto.replace(/^\//, ''));
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        } catch (err) {
          console.error('Error deleting old profile photo:', err.message);
        }
      }

      user.profilePhoto = `/uploads/${req.file.filename}`;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePhoto: buildProfilePhotoUrl(req, user.profilePhoto)
      }
    });
  } catch (error) {
    // Clean up uploaded file if save failed
    if (req.file) {
      try {
        const filePath = path.join(__dirname, '..', 'uploads', req.file.filename);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Error deleting uploaded file after failed update:', err.message);
      }
    }

    res.status(500).json({ success: false, message: error.message });
  }
};


exports.deleteProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete profile photo file if exists
    if (user.profilePhoto) {
      try {
        const filePath = path.join(__dirname, '..', user.profilePhoto.replace(/^\//, ''));
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (err) {
        console.error('Error deleting profile photo during user delete:', err.message);
      }
    }

    // Remove user record from database using model method
    await User.findByIdAndDelete(user._id);

    res.status(200).json({ success: true, message: 'User profile deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public: Get a user's profile by id (returns limited fields)
exports.getProfileById = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePhoto: buildProfilePhotoUrl(req, user.profilePhoto)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
