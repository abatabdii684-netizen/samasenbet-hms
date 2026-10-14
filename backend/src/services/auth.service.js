/**
 * Authentication Service
 */

const bcrypt    = require('bcryptjs');
const jwt       = require('jsonwebtoken');
const crypto    = require('crypto');
const { prisma } = require('../config/database');
const jwtConfig  = require('../config/jwt');
const AppError   = require('../utils/AppError');
const { sendMail } = require('../config/mailer');
const logger     = require('../utils/logger');

class AuthService {
  /**
   * Login — validate credentials, return tokens + user
   */
  async login(email, password, ip = null) {
    if (!email || !password) {
      throw AppError.badRequest('Email and password are required');
    }

    const user = await prisma.user.findUnique({
      where: { email: String(email).trim().toLowerCase() },
      include: {
        role: {
          include: {
            permissions: { include: { permission: true } },
          },
        },
        employee: {
          select: {
            id: true, firstName: true, lastName: true,
            jobTitle: true, department: { select: { name: true } },
          },
        },
      },
    });

    if (!user) throw AppError.unauthorized('Invalid email or password');
    if (!user.isActive) throw AppError.forbidden('Your account is deactivated. Contact admin.');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw AppError.unauthorized('Invalid email or password');

    const accessToken  = this._generateAccessToken(user);
    const refreshToken = this._generateRefreshToken(user);

    // Persist hashed refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshToken: await bcrypt.hash(refreshToken, 10),
        lastLoginAt:  new Date(),
        lastLoginIp:  ip,
      },
    });

    return {
      accessToken,
      refreshToken,
      user: this._sanitizeUser(user),
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(token) {
    let decoded;
    try {
      decoded = jwt.verify(token, jwtConfig.refresh.secret);
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token');
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    if (!user || !user.refreshToken) throw AppError.unauthorized('Session expired. Please log in again.');
    if (!user.isActive) throw AppError.forbidden('Account deactivated');

    const isValid = await bcrypt.compare(token, user.refreshToken);
    if (!isValid) throw AppError.unauthorized('Invalid refresh token');

    const newAccessToken  = this._generateAccessToken(user);
    const newRefreshToken = this._generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data:  { refreshToken: await bcrypt.hash(newRefreshToken, 10) },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout — clear refresh token
   */
  async logout(userId) {
    await prisma.user.update({
      where: { id: userId },
      data:  { refreshToken: null },
    });
  }

  /**
   * Get current user profile
   */
  async getMe(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: { permissions: { include: { permission: true } } },
        },
        employee: {
          include: { department: true },
        },
      },
    });
    if (!user) throw AppError.notFound('User not found');
    return this._sanitizeUser(user);
  }

  /**
   * Forgot password — generate reset token, send email
   */
  async forgotPassword(email) {
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return; // Silent fail — don't expose whether email exists

    const token  = crypto.randomBytes(32).toString('hex');
    const hashed = crypto.createHash('sha256').update(token).digest('hex');
    const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    await prisma.user.update({
      where: { id: user.id },
      data:  { passwordResetToken: hashed, passwordResetExpiry: expiry },
    });

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

    try {
      await sendMail({
        to:      email,
        subject: 'YFM General Hospital PLC — Password Reset',
        html: `
          <h2>Password Reset Request</h2>
          <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;">Reset Password</a>
          <p style="margin-top:16px;color:#666;font-size:12px;">If you did not request this, please ignore this email.</p>
        `,
      });
    } catch (err) {
      logger.error('Failed to send reset email:', err);
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(token, newPassword) {
    if (!token || !newPassword) throw AppError.badRequest('Token and new password are required');

    const hashed = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken:  hashed,
        passwordResetExpiry: { gt: new Date() },
      },
    });

    if (!user) throw AppError.badRequest('Invalid or expired reset token');

    const hashedPwd = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password:            hashedPwd,
        passwordResetToken:  null,
        passwordResetExpiry: null,
        passwordChangedAt:   new Date(),
        refreshToken:        null,
      },
    });
  }

  /**
   * Change password (authenticated)
   */
  async changePassword(userId, currentPassword, newPassword) {
    if (!currentPassword || !newPassword) {
      throw AppError.badRequest('Current and new passwords are required');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw AppError.notFound('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw AppError.badRequest('Current password is incorrect');

    if (currentPassword === newPassword) {
      throw AppError.badRequest('New password must be different from current password');
    }

    const hashedPwd = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);

    await prisma.user.update({
      where: { id: userId },
      data: {
        password:          hashedPwd,
        passwordChangedAt: new Date(),
        refreshToken:      null,
      },
    });
  }

  // ─── Private helpers ──────────────────────────────────────────

  _generateAccessToken(user) {
    return jwt.sign(
      { userId: user.id, roleId: user.roleId, roleName: user.role?.name },
      jwtConfig.access.secret,
      { expiresIn: jwtConfig.access.expiresIn }
    );
  }

  _generateRefreshToken(user) {
    return jwt.sign(
      { userId: user.id },
      jwtConfig.refresh.secret,
      { expiresIn: jwtConfig.refresh.expiresIn }
    );
  }

  _sanitizeUser(user) {
    const { password, refreshToken, passwordResetToken, passwordResetExpiry, ...safe } = user;
    safe.permissions = user.role?.permissions?.map((rp) => rp.permission.name) || [];
    return safe;
  }
}

module.exports = new AuthService();
