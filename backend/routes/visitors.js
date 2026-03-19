const express = require('express');
const router = express.Router();
const { Visitor } = require('../models');

// GET /api/visitors - Get all visitors
router.get('/', async (req, res) => {
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
    const now = new Date();
    const visitDate = now.toLocaleDateString('ar-EG');
    const visitTime = now.toLocaleTimeString('ar-EG');
    const visitor = await Visitor.create({ userAgent, visitDate, visitTime });
    res.status(201).json(visitor);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
