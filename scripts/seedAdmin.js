require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../Models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('MongoDB connected');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@harvon.in' });
    if (existingAdmin) {
      console.log('Admin user already exists with email: admin@harvon.in');
      process.exit(0);
    }

    // Create admin user
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@harvon.in',
      password: 'Harvon@1709',
      phoneNumber: '+91-00000-00000',
      role: 'admin'
    });

    console.log('✓ Admin user created successfully!');
    console.log(`  Email: ${adminUser.email}`);
    console.log(`  Role: ${adminUser.role}`);
    console.log(`  ID: ${adminUser._id}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();
