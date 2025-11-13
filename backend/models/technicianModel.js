const mongoose = require('mongoose');

const serviceSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  category: { type: String },
  price: { type: Number, required: true },
  estimatedTime: { type: String },
  isActive: { type: Boolean, default: true },
});

// Novo: avaliações de clientes para técnicos
const reviewSchema = mongoose.Schema(
  {
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    comment: { type: String },
  },
  { timestamps: true }
);

const technicianSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Novo: ID de login exclusivo para técnico
    loginId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    services: [serviceSchema],
    specialties: [String],
    rating: {
      type: Number,
      default: 0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    // Novo: armazenar avaliações individuais
    reviews: [reviewSchema],
    availability: {
      type: Boolean,
      default: true,
    },
    pickupService: {
      type: Boolean,
      default: false,
    },
    pickupFee: {
      type: Number,
      default: 0,
    },
    certifications: [String],
    paymentMethods: [String],
    subscriptionActive: {
      type: Boolean,
      default: false,
    },
    subscriptionExpiry: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Technician', technicianSchema);