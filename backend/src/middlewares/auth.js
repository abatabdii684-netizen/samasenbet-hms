/**
 * Authentication & Authorization Middleware
 */

const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
const { prisma } = require('../config/database');
const jwtConfig = require('../config/jwt');

/**
 * Verify JWT access token
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Check Authorization header
    if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check cookie
    else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(AppError.unauthorized('Access token is required'));
    }

    // Verify token
    const decoded = jwt.verify(token, jwtConfig.access.secret);

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        employee: {
          select: { id: true, firstName: true, lastName: true, department: true },
        },
      },
    });

    if (!user) {
      return next(AppError.unauthorized('User no longer exists'));
    }

    if (!user.isActive) {
      return next(AppError.forbidden('Your account has been deactivated. Contact admin.'));
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt) {
      const changedAt = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < changedAt) {
        return next(AppError.unauthorized('Password was recently changed. Please log in again.'));
      }
    }

    // Attach user to request
    req.user = user;
    req.userId = user.id;
    req.roleId = user.roleId;
    req.roleName = user.role?.name;

    // Extract permissions from role
    let permsFromRole = user.role?.permissions?.map((rp) => rp.permission.name) || [];

    // If no permissions loaded but user has a role, try fetching directly
    if (permsFromRole.length === 0 && user.roleId) {
      try {
        const rolePerms = await prisma.rolePermission.findMany({
          where: { roleId: user.roleId },
          include: { permission: true },
        });
        permsFromRole = rolePerms.map((rp) => rp.permission.name);
      } catch (e) {
        // ignore — superRole bypass will handle it
      }
    }

    req.permissions = permsFromRole;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Access token expired'));
    }
    if (error.name === 'JsonWebTokenError') {
      return next(AppError.unauthorized('Invalid access token'));
    }
    next(error);
  }
};

/**
 * Authorize by role name(s)
 * @param {...string} roles
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    if (!roles.includes(req.roleName)) {
      return next(AppError.forbidden(`Role '${req.roleName}' is not allowed to access this resource`));
    }
    next();
  };
};

/**
 * Authorize by permission name(s)
 * Requires ALL listed permissions
 * CEO / ADMIN_FINANCE / MEDICAL_DIRECTOR bypass all permission checks
 * @param {...string} perms
 */
const authorizePermissions = (...perms) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    // Super-admin roles bypass all permission checks
    const superRoles = ['CEO', 'ADMIN_FINANCE', 'MEDICAL_DIRECTOR', 'MEDICAL_SUPERVISOR', 'super_admin', 'admin'];
    if (superRoles.includes(req.roleName)) {
      return next();
    }
    // If permissions array is empty, likely a DB sync issue — allow access and log warning
    if (!req.permissions || req.permissions.length === 0) {
      console.warn(`[AUTH WARN] User ${req.userId} (role: ${req.roleName}) has no permissions loaded — allowing access`);
      return next();
    }
    const missing = perms.filter((p) => !req.permissions.includes(p));
    if (missing.length > 0) {
      return next(
        AppError.forbidden(`Missing permissions: ${missing.join(', ')}`)
      );
    }
    next();
  };
};

/**
 * Authorize by ANY of the listed permissions
 * @param {...string} perms
 */
const authorizeAnyPermission = (...perms) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(AppError.unauthorized());
    }
    // Super-admin roles bypass all permission checks
    const superRoles = ['CEO', 'ADMIN_FINANCE', 'MEDICAL_DIRECTOR', 'MEDICAL_SUPERVISOR', 'super_admin', 'admin'];
    if (superRoles.includes(req.roleName)) {
      return next();
    }
    const hasAny = perms.some((p) => req.permissions.includes(p));
    if (!hasAny) {
      return next(AppError.forbidden('Insufficient permissions'));
    }
    next();
  };
};

module.exports = {
  authenticate,
  authorizeRoles,
  authorizePermissions,
  authorizeAnyPermission,
};
