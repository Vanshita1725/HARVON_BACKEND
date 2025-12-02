const jwt = require('jsonwebtoken');
const User = require('../Models/User');

// Protect routes
exports.protect = async (req, res, next) => {
  let token;

  // Accept both forms:
  // 1) "Authorization: Bearer <token>" (preferred)
  // 2) "Authorization: <token>" (some clients send token without Bearer)
  const authHeader = req.headers.authorization;
  console.log('Auth header received:', authHeader);
  if (authHeader) {
    if (authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      // Fallback: treat the whole header as the token
      token = authHeader;
    }
  }

  // Make sure token exists
  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(404).json({ success: false, message: 'No user found with this id' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Not authorized to access this route' });
  }
};
