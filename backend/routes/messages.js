const express = require('express');
const router = express.Router();
const { Message } = require('../models');
const authMiddleware = require('../middleware/auth');

// GET /api/messages - Get all messages
router.get('/', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages - Create a new message
router.post('/', async (req, res) => {
  try {
    const { text, distanceInMeters, senderLat, senderLng } = req.body;
    if (distanceInMeters == null || senderLat == null || senderLng == null) {
      return res.status(400).json({ message: 'Location fields are required' });
    }

    let address = 'Address unavailable';
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${senderLat}&lon=${senderLng}&zoom=14&addressdetails=1`);
      const data = await response.json();
      if (data && data.display_name) {
        address = data.display_name;
      }
    } catch (e) {
      console.error('Reverse geocoding error:', e);
    }

    const message = await Message.create({ text: text || '', distanceInMeters, senderLat, senderLng });

    // Future webhook integration point (e.g., n8n / Telegram)
    // if (process.env.WEBHOOK_URL) {
    //   await fetch(process.env.WEBHOOK_URL, { method: 'POST', body: JSON.stringify(message) });
    // }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/messages/:id - Update message
router.put('/:id', async (req, res) => {
  try {
    const { text } = req.body;
    const message = await Message.findByIdAndUpdate(req.params.id, { text }, { new: true });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
