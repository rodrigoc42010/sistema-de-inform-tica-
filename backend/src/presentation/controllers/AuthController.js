const authenticateUser = require('../../application/AuthenticateUser');
const registerUser = require('../../application/RegisterUser');
const tokenService = require('../../infrastructure/external/TokenService');
const userRepository = require('../../infrastructure/database/PostgresUserRepository');
const { UnauthorizedError } = require('../utils/httpErrors');
const asyncHandler = require('express-async-handler');

class AuthController {
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    const { user, accessToken, refreshToken } = await authenticateUser.execute({
      email,
      password,
      ipAddress,
      userAgent,
    });

    // Set Secure httpOnly Cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 * 1000, // 15 min
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(200).json({
      success: true,
      user,
    });
  });

  refresh = asyncHandler(async (req, res) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) {
      throw new UnauthorizedError('Refresh token ausente');
    }

    try {
      const decoded = tokenService.verifyRefreshToken(refreshToken);
      const user = await userRepository.findById(decoded.id);

      if (!user) {
        throw new UnauthorizedError('Usuário não encontrado');
      }

      const { token: accessToken } = tokenService.generateAccessToken(user);

      res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 15 * 60 * 1000,
      });

      res.status(200).json({ success: true });
    } catch (err) {
      throw new UnauthorizedError('Refresh token inválido');
    }
  });

  register = asyncHandler(async (req, res) => {
    const user = await registerUser.execute(req.body);
    res.status(201).json({
      success: true,
      user,
    });
  });

  logout = asyncHandler(async (req, res) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.status(200).json({ success: true, message: 'Logged out' });
  });
}

module.exports = new AuthController();
