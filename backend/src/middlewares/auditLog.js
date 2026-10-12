/**
 * Audit Log Middleware
 * Logs all mutating actions (POST, PUT, PATCH, DELETE) to the database
 */

const { prisma } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Create an audit log entry
 */
const createAuditLog = async ({
  userId,
  action,
  module,
  targetId = null,
  targetType = null,
  oldData = null,
  newData = null,
  ipAddress = null,
  userAgent = null,
  description = null,
}) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        module,
        targetId: targetId ? String(targetId) : null,
        targetType,
        oldData: oldData ? JSON.stringify(oldData) : null,
        newData: newData ? JSON.stringify(newData) : null,
        ipAddress,
        userAgent,
        description,
      },
    });
  } catch (error) {
    logger.error('Failed to create audit log:', error);
  }
};

/**
 * Auto audit log middleware — logs HTTP mutations
 */
const auditMiddleware = (module) => {
  return (req, res, next) => {
    const methodActionMap = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    };

    const action = methodActionMap[req.method];
    if (!action || !req.user) return next();

    // Store original json method
    const originalJson = res.json.bind(res);

    res.json = (body) => {
      if (res.statusCode < 400) {
        createAuditLog({
          userId: req.user.id,
          action,
          module,
          targetId: req.params.id || body?.data?.id || null,
          targetType: module,
          newData: req.method !== 'DELETE' ? req.body : null,
          ipAddress: req.ip || req.headers['x-forwarded-for'],
          userAgent: req.headers['user-agent'],
          description: `${action} on ${module} by ${req.user.username}`,
        });
      }
      return originalJson(body);
    };

    next();
  };
};

module.exports = { auditMiddleware, createAuditLog };
