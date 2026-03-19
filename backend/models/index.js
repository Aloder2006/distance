const mongoose = require('mongoose');

// Location model - single document, always overwrite
const locationSchema = new mongoose.Schema({
  adminLat: { type: Number, required: true },
  adminLng: { type: Number, required: true },
  updatedAt: { type: Date, default: Date.now }
});
const Location = mongoose.model('Location', locationSchema);

// Message model
const messageSchema = new mongoose.Schema({
  text: { type: String, default: '' },
  distanceInMeters: { type: Number, required: true },
  senderLat: { type: Number, required: true },
  senderLng: { type: Number, required: true },
  address: { type: String },
  ipAddress: { type: String },
  deviceInfo: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now }
});
const Message = mongoose.model('Message', messageSchema);

// Visitor model
const visitorSchema = new mongoose.Schema({
  userAgent: { type: String },
  visitDate: { type: String },
  visitTime: { type: String },
  createdAt: { type: Date, default: Date.now }
});
const Visitor = mongoose.model('Visitor', visitorSchema);

module.exports = { Location, Message, Visitor };
