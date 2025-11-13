const mongoose = require('mongoose');

const paymentSchema = mongoose.Schema(
  {
    // Tipo de pagamento (ex: ad_fee, ticket)
    type: {
      type: String,
      enum: ['ticket', 'ad_fee', 'ad_free'],
      default: 'ticket',
      index: true,
    },
    // Referência opcional a anúncio (para ad_fee)
    ad: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ad',
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: false,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'BRL',
    },
    paymentMethod: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pendente', 'processando', 'pago', 'falhou', 'reembolsado'],
      default: 'pendente',
    },
    paymentIntentId: String,
    paymentDate: Date,
    receiptUrl: String,
    notes: String,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Payment', paymentSchema);