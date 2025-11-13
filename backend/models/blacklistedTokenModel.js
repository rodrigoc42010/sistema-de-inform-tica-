const mongoose = require('mongoose');

const blacklistedTokenSchema = new mongoose.Schema(
  {
    jti: { type: String, required: true, unique: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
    reason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('BlacklistedToken', blacklistedTokenSchema);