const express       = require('express');
const router        = express.Router();
const path          = require('path');
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const asyncHandler  = require('../middlewares/asyncHandler');
const BackupService = require('../services/backup.service');
const ApiResponse   = require('../utils/apiResponse');

router.use(authenticate);
const canManage = authorizePermissions('backup:manage');

// GET /backup — list all backup files
router.get('/', canManage, asyncHandler(async (req, res) => {
  const files = await BackupService.getAll();
  return ApiResponse.success(res, files);
}));

// POST /backup/create — run mysqldump
router.post('/create', canManage, asyncHandler(async (req, res) => {
  const result = await BackupService.create(req.body.label || '');
  return ApiResponse.created(res, result, 'Backup created successfully');
}));

// GET /backup/download/:id — stream file to client
router.get('/download/:id', canManage, asyncHandler(async (req, res) => {
  const filePath = await BackupService.download(req.params.id);
  res.download(filePath, req.params.id);
}));

// DELETE /backup/:id — delete backup file
router.delete('/:id', canManage, asyncHandler(async (req, res) => {
  await BackupService.remove(req.params.id);
  return ApiResponse.success(res, null, 'Backup deleted');
}));

module.exports = router;
