const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'; // Default for easy setup if not defined
  
  if (password === adminPassword) {
    const token = jwt.sign({ role: 'admin' }, process.env.JWT_SECRET || 'distance_secret_key_2026', { expiresIn: '30d' });
    res.json({ token, message: 'Logged in successfully' });
  } else {
    res.status(401).json({ message: 'Incorrect password' });
  }
});

module.exports = router;
