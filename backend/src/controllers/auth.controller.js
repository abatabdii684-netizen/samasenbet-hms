/**
 * Authentication Controller
 * YFM General Hospital PLC — HMS
 */

const asyncHandler = require('../middlewares/asyncHandler');
const AuthService  = require('../services/auth.service');
const ApiResponse  = require('../utils/apiResponse');
const AppError     = require('../utils/AppError');
const { createAuditLog } = require('../middlewares/auditLog');

const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// Dev previews run inside a cross-site iframe, where SameSite=Strict/Lax cookies are never sent.
const refreshCookieOptions = ({ clear = false } = {}) => {
  const isProduction = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure:   true,
    sameSite: isProduction ? 'strict' : 'none',
    path:     '/',
    ...(clear ? {} : { maxAge: REFRESH_COOKIE_MAX_AGE }),
  };
};

class AuthController {
  /**
   * POST /auth/login
   */
  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await AuthService.login(email, password, req.ip);

    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions());

    await createAuditLog({
      userId:      result.user.id,
      action:      'LOGIN',
      module:      'auth',
      ipAddress:   req.ip,
      userAgent:   req.headers['user-agent'],
      description: `User ${result.user.username} logged in`,
    });

    return ApiResponse.success(res, {
      user:        result.user,
      accessToken: result.accessToken,
    }, 'Login successful');
  });

  /**
   * POST /auth/refresh-token
   */
  refreshToken = asyncHandler(async (req, res) => {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!token) throw AppError.unauthorized('Refresh token required');

    const result = await AuthService.refreshToken(token);

    res.cookie('refreshToken', result.refreshToken, refreshCookieOptions());

    return ApiResponse.success(res, { accessToken: result.accessToken }, 'Token refreshed');
  });

  /**
   * POST /auth/logout
   */
  logout = asyncHandler(async (req, res) => {
    await AuthService.logout(req.userId);

    res.clearCookie('refreshToken', refreshCookieOptions({ clear: true }));

    await createAuditLog({
      userId:      req.userId,
      action:      'LOGOUT',
      module:      'auth',
      ipAddress:   req.ip,
      description: `User ${req.user.username} logged out`,
    });

    return ApiResponse.success(res, null, 'Logged out successfully');
  });

  /**
   * GET /auth/me
   */
  getMe = asyncHandler(async (req, res) => {
    const user = await AuthService.getMe(req.userId);
    return ApiResponse.success(res, user);
  });

  /**
   * POST /auth/forgot-password
   */
  forgotPassword = asyncHandler(async (req, res) => {
    const { email } = req.body;
    await AuthService.forgotPassword(email);
    return ApiResponse.success(res, null,
      'If that email is registered, a reset link has been sent.');
  });

  /**
   * POST /auth/reset-password
   */
  resetPassword = asyncHandler(async (req, res) => {
    const { token, password } = req.body;
    await AuthService.resetPassword(token, password);
    return ApiResponse.success(res, null, 'Password reset successfully');
  });

  /**
   * PATCH /auth/change-password
   */
  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.userId, currentPassword, newPassword);

    await createAuditLog({
      userId:      req.userId,
      action:      'UPDATE',
      module:      'auth',
      description: `User ${req.user.username} changed password`,
    });

    return ApiResponse.success(res, null, 'Password changed successfully');
  });
}

module.exports = new AuthController();
