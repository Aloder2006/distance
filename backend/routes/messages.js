const express = require('express');
const router = express.Router();
const { Message } = require('../models');

// GET /api/messages - Get all messages
router.get('/', async (req, res) => {
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
    if (!text || distanceInMeters == null || senderLat == null || senderLng == null) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const message = await Message.create({ text, distanceInMeters, senderLat, senderLng });

    // Future webhook integration point (e.g., n8n / Telegram)
    // if (process.env.WEBHOOK_URL) {
    //   await fetch(process.env.WEBHOOK_URL, { method: 'POST', body: JSON.stringify(message) });
    // }

    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
