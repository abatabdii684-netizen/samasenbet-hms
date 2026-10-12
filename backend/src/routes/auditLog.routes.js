const express      = require('express');
const router       = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');
const { prisma }   = require('../config/database');
const ApiResponse  = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate, authorizePermissions('audit:view'));

router.get('/', asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { module: mod, action, userId } = req.query;
  const where = {};
  if (mod)    where.module = mod;
  if (action) where.action = action;
  if (userId) where.userId = parseInt(userId);

  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({
      where, skip, take: limit,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id:true, username:true, email:true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const log = await prisma.auditLog.findUnique({
    where: { id: parseInt(req.params.id) },
    include: { user: { select: { id:true, username:true, email:true } } },
  });
  if (!log) return ApiResponse.notFound(res, 'Audit log not found');
  return ApiResponse.success(res, log);
}));

router.get('/user/:userId', asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const [data, total] = await Promise.all([
    prisma.auditLog.findMany({ where: { userId: parseInt(req.params.userId) }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.auditLog.count({ where: { userId: parseInt(req.params.userId) } }),
  ]);
  return ApiResponse.paginated(res, data, page, limit, total);
}));

module.exports = router;
