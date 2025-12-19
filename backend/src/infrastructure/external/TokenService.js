const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class TokenService {
  constructor() {
    this.secret = process.env.JWT_SECRET;
    this.refreshSecret =
      process.env.JWT_REFRESH_SECRET || this.secret + '_refresh';
  }

  generateAccessToken(user) {
    const jti = crypto.randomBytes(16).toString('hex');
    const payload = {
      id: user.id,
      role: user.role,
      jti,
    };
    const token = jwt.sign(payload, this.secret, { expiresIn: '15m' });
    return { token, jti };
  }

  generateRefreshToken(user) {
    const jti = crypto.randomBytes(16).toString('hex');
    const payload = {
      id: user.id,
      jti,
    };
    const token = jwt.sign(payload, this.refreshSecret, { expiresIn: '7d' });
    return { token, jti };
  }

  verifyAccessToken(token) {
    return jwt.verify(token, this.secret);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, this.refreshSecret);
  }
}

module.exports = new TokenService();
