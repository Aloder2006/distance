const express = require('express');
const router = express.Router();
const { Location } = require('../models');
const authMiddleware = require('../middleware/auth');

// GET /api/location - Get admin location
router.get('/', async (req, res) => {
  try {
    const location = await Location.findOne();
    if (!location) return res.status(404).json({ message: 'Location not set yet' });
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/location - Update admin location (always overwrite single document)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { adminLat, adminLng } = req.body;
    if (adminLat == null || adminLng == null) {
      return res.status(400).json({ message: 'adminLat and adminLng are required' });
    }
    const location = await Location.findOneAndUpdate(
      {},
      { adminLat, adminLng, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(location);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
