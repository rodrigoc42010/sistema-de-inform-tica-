const mongoose = require('mongoose');
const crypto = require('crypto');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Por favor, adicione um nome'],
    },
    email: {
      type: String,
      required: [true, 'Por favor, adicione um email'],
      unique: true,
    },
    password: {
      type: String,
      required: [true, 'Por favor, adicione uma senha'],
    },
    role: {
      type: String,
      enum: ['client', 'technician'],
      required: true,
    },
    phone: {
      type: String,
      required: [true, 'Por favor, adicione um telefone'],
    },
    cpfCnpj: {
      type: String,
    },
    address: {
      street: String,
      number: String,
      complement: String,
      neighborhood: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
    },
    // Informações bancárias para recebimentos (PIX e transferência)
    bankInfo: {
      bank: { type: String },
      agency: { type: String },
      account: { type: String },
      pixKey: { type: String },
    },
    googleId: String,
    microsoftId: String,
    profileImage: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
    },
    emailVerificationExpires: {
      type: Date,
    },
    // Segurança de conta
    failedLoginAttempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    lockUntil: {
      type: Date,
    },
    lastLoginAt: {
      type: Date,
    },
    passwordChangedAt: {
      type: Date,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
      },
      coordinates: {
        type: [Number],
        index: '2dsphere',
      },
    },
    // Controle de anúncios (clientes podem pagar para remover)
    adFreeUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Método para gerar token de verificação de e-mail
userSchema.methods.generateEmailVerificationToken = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(token).digest('hex');
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 horas
  return token;
};

module.exports = mongoose.model('User', userSchema);