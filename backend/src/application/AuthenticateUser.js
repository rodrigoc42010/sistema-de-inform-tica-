const bcrypt = require('bcryptjs');
const { UnauthorizedError, LockedError } = require('../utils/httpErrors');
const userRepository = require('../infrastructure/database/PostgresUserRepository');
const sessionRepository = require('../infrastructure/database/PostgresSessionRepository');
const tokenService = require('../infrastructure/external/TokenService');

class AuthenticateUser {
  async execute({ email, password, ipAddress, userAgent }) {
    const user = await userRepository.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError('Credenciais inválidas');
    }

    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      throw new LockedError('Conta bloqueada temporariamente');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      // Handle failed attempts logic here (omitted for brevity, but should be in repository)
      throw new UnauthorizedError('Credenciais inválidas');
    }

    const { token: accessToken, jti: accessJti } =
      tokenService.generateAccessToken(user);
    const { token: refreshToken, jti: refreshJti } =
      tokenService.generateRefreshToken(user);

    // Store session
    await sessionRepository.create({
      userId: user.id,
      jti: refreshJti,
      ipAddress,
      userAgent,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }
}

module.exports = new AuthenticateUser();
