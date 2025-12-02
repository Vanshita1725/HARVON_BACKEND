const express = require('express');
const mongoose = require('mongoose');
require('dotenv').config();
const cors = require('cors');

const app = express();

// Middleware
// Capture raw request body for debugging (temporary)
app.use(express.json({
  verify: (req, res, buf, encoding) => {
    try {
      req.rawBody = buf.toString(encoding || 'utf8');
    } catch (e) {
      req.rawBody = undefined;
    }
  }
}));
app.use(express.urlencoded({ extended: true }));

// Enable CORS - allow requests from frontend (adjust origin as needed)
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173').split(',');
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.options('*', cors({ origin: allowedOrigins, credentials: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Handle invalid JSON payloads from express.json()
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('Invalid JSON payload:', err.message);
    console.error('Request headers:', req && req.headers);
    console.error('Raw body:', req && req.rawBody);
    return res.status(400).json({ success: false, message: 'Invalid JSON payload' });
  }
  next(err);
});

// Connect to MongoDB
mongoose.connect(process.env.DATABASE_URL)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Import routes
const authRoutes = require('./Routes/authRoutes');

// Better Mongoose connection logging
const db = mongoose.connection;
db.on('connected', () => console.log('Mongoose event: connected'));
db.on('error', (err) => console.error('Mongoose event: error', err));
db.on('disconnected', () => console.log('Mongoose event: disconnected'));

// Use routes
app.use('/api/auth', authRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to the API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  const multer = require('multer');
  
  if (err instanceof multer.MulterError) {
    console.error('Multer error:', err.message);
    if (err.code === 'FILE_TOO_LARGE') {
      return res.status(400).json({ success: false, message: 'File size exceeds 5MB limit' });
    }
    return res.status(400).json({ success: false, message: 'File upload error: ' + err.message });
  } else if (err && err.message) {
    console.error('File upload error:', err.message);
    return res.status(400).json({ success: false, message: err.message });
  }

  // Other errors
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Server error' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
