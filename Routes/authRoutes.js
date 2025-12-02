const express = require('express');
const { register, login, getMe, updateProfile, deleteProfile } = require('../Controller/authController');
const { protect } = require('../middleware/auth');
const upload = require('../config/multer');

const router = express.Router();

// Public routes
router.post('/register', upload.single('profilePhoto'), register);
router.post('/login', login);

// Protected routes
router.get('/me', protect, getMe);
router.put('/me', protect, upload.single('profilePhoto'), updateProfile);
router.delete('/me', protect, deleteProfile);

module.exports = router;
