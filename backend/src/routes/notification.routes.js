const express      = require('express');
const router       = express.Router();
const { authenticate } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');
const { prisma }   = require('../config/database');
const ApiResponse  = require('../utils/apiResponse');

router.use(authenticate);

router.get('/', asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  return ApiResponse.success(res, notifications);
}));

router.get('/unread', asyncHandler(async (req, res) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId, isRead: false },
    orderBy: { createdAt: 'desc' },
  });
  return ApiResponse.success(res, notifications);
}));

router.patch('/:id/read', asyncHandler(async (req, res) => {
  const n = await prisma.notification.findFirst({ where: { id: parseInt(req.params.id), userId: req.userId } });
  if (!n) return ApiResponse.notFound(res, 'Notification not found');
  const updated = await prisma.notification.update({ where: { id: n.id }, data: { isRead: true, readAt: new Date() } });
  return ApiResponse.success(res, updated);
}));

router.patch('/read-all', asyncHandler(async (req, res) => {
  await prisma.notification.updateMany({ where: { userId: req.userId, isRead: false }, data: { isRead: true, readAt: new Date() } });
  return ApiResponse.success(res, null, 'All notifications marked as read');
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await prisma.notification.deleteMany({ where: { id: parseInt(req.params.id), userId: req.userId } });
  return ApiResponse.success(res, null, 'Notification deleted');
}));

module.exports = router;
