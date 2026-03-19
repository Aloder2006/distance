const express = require('express');
const router = express.Router();
const { Visitor } = require('../models');
const authMiddleware = require('../middleware/auth');

// GET /api/visitors - Get all visitors
router.get('/', authMiddleware, async (req, res) => {
  try {
    const visitors = await Visitor.find().sort({ createdAt: -1 });
    res.json(visitors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/visitors - Log a visitor silently
router.post('/', async (req, res) => {
  try {
    const { userAgent } = req.body;
    let ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown IP';
    if (ipAddress.includes(',')) ipAddress = ipAddress.split(',')[0].trim();
    if (ipAddress === '::1' || ipAddress === '127.0.0.1') ipAddress = ''; // Let API use public IP if localhost

    let address = 'Unknown location';
    if (ipAddress) {
      try {
        const response = await fetch(`http://ip-api.com/json/${ipAddress}?lang=en`);
        const data = await response.json();
        if (data && data.status === 'success') {
          address = `${data.city}, ${data.country}`;
        }
      } catch (e) {
        console.error('IP Geolocation error:', e);
      }
    } else {
      ipAddress = 'Localhost';
      address = 'Localhost';
    }

    const now = new Date();
    const visitDate = now.toLocaleDateString('en-US');
    const visitTime = now.toLocaleTimeString('en-US');
    const visitor = await Visitor.create({ userAgent, ipAddress, address, visitDate, visitTime });
    res.status(201).json(visitor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
