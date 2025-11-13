const mongoose = require('mongoose');

const adSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    text: { type: String, required: true },
    linkUrl: { type: String },
    mediaUrl: { type: String }, // opcional, usar /uploads
    audience: { type: String, enum: ['client', 'technician', 'all'], default: 'client' },
    active: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    impressions: { type: Number, default: 0 },
    clicks: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ad', adSchema);