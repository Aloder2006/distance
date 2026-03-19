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

// POST /api/messages - Create a new message (initial visit)
router.post('/', async (req, res) => {
  try {
    const { text, distanceInMeters, senderLat, senderLng, deviceInfo } = req.body;

    let ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown IP';
    if (ipAddress.includes(',')) ipAddress = ipAddress.split(',')[0].trim();
    if (ipAddress === '::1' || ipAddress === '127.0.0.1') ipAddress = 'Localhost';

    let address = 'Pending location...';
    
    // If coords are provided immediately (rare now), geocode them. Else try IP geocoding.
    if (senderLat != null && senderLng != null) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${senderLat}&lon=${senderLng}&zoom=14&addressdetails=1`);
        const data = await response.json();
        if (data && data.display_name) address = data.display_name;
      } catch (e) {
        console.error('Reverse geocoding error:', e);
      }
    } else if (ipAddress !== 'Localhost') {
      try {
        const response = await fetch(`http://ip-api.com/json/${ipAddress}?lang=en`);
        const data = await response.json();
        if (data && data.status === 'success') {
          address = `${data.city}, ${data.country} (IP approx)`;
        }
      } catch (e) { }
    }

    const message = await Message.create({ 
      text: text || '', 
      distanceInMeters, 
      senderLat, 
      senderLng, 
      address,
      ipAddress,
      deviceInfo 
    });

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
    const { text, distanceInMeters, senderLat, senderLng } = req.body;
    let updateData = {};
    if (text !== undefined) updateData.text = text;
    if (distanceInMeters !== undefined) updateData.distanceInMeters = distanceInMeters;
    if (senderLat !== undefined) updateData.senderLat = senderLat;
    if (senderLng !== undefined) updateData.senderLng = senderLng;

    if (senderLat != null && senderLng != null) {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${senderLat}&lon=${senderLng}&zoom=14&addressdetails=1`);
        const data = await response.json();
        if (data && data.display_name) {
          updateData.address = data.display_name;
        }
      } catch (e) {
        console.error('Reverse geocoding error:', e);
      }
    }

    const message = await Message.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!message) return res.status(404).json({ message: 'Message not found' });
    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
