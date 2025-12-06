const express = require('express');
const { register, login, adminLogin, getMe, updateProfile, deleteProfile, getProfileById, sendOtp, verifyOtp } = require('../Controller/authController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

const router = express.Router();

// Public routes
router.post('/register', upload.single('profilePhoto'), register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
// OTP endpoints for registration/verification
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
// Public profile by id
router.get('/profile/:id', getProfileById);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, upload.single('profilePhoto'), updateProfile);
router.delete('/me', protect, deleteProfile);

module.exports = router;
