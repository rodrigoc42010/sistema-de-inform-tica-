const mongoose = require('mongoose');

const attachmentSchema = mongoose.Schema({
  type: {
    type: String,
    enum: ['image', 'video', 'document'],
    required: true,
  },
  url: {
    type: String,
    required: true,
  },
  description: String,
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
  },
});

const serviceItemSchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  price: {
    type: Number,
    required: true,
  },
  approved: {
    type: Boolean,
    default: false,
  },
});

const ticketSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Por favor, adicione um título para o chamado'],
    },
    description: {
      type: String,
      required: [true, 'Por favor, adicione uma descrição do problema'],
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    technician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    status: {
      type: String,
      enum: ['aberto', 'em_andamento', 'aguardando_aprovacao', 'aprovado', 'reprovado', 'concluido', 'cancelado'],
      default: 'aberto',
    },
    priority: {
      type: String,
      enum: ['baixa', 'media', 'alta', 'urgente'],
      default: 'media',
    },
    deviceType: String,
    deviceBrand: String,
    deviceModel: String,
    problemCategory: String,
    attachments: [attachmentSchema],
    serviceItems: [serviceItemSchema],
    initialDiagnosis: String,
    finalReport: String,
    startDate: Date,
    estimatedCompletionDate: Date,
    completionDate: Date,
    totalPrice: {
      type: Number,
      default: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['pendente', 'pago', 'reembolsado'],
      default: 'pendente',
    },
    paymentMethod: String,
    pickupRequested: {
      type: Boolean,
      default: false,
    },
    pickupAddress: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    notes: [{
      text: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Ticket', ticketSchema);