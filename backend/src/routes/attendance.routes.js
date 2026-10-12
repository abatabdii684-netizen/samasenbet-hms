const express      = require('express');
const router       = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const asyncHandler     = require('../middlewares/asyncHandler');
const AttendanceService = require('../services/attendance.service');
const ApiResponse      = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

// ── specific routes BEFORE /:id ──────────────────────────────────
router.get('/today', authorizePermissions('attendance:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await AttendanceService.getToday());
}));

router.get('/summary', authorizePermissions('attendance:view'), asyncHandler(async (req, res) => {
  const { employeeId, month, year } = req.query;
  return ApiResponse.success(res, await AttendanceService.getSummary({ employeeId, month, year }));
}));

router.get('/', authorizePermissions('attendance:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, date, employeeId } = req.query;
  const { data, total } = await AttendanceService.getAll({ skip, limit, search, date, employeeId });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.post('/check-in', asyncHandler(async (req, res) => {
  const empId = req.body.employeeId ? parseInt(req.body.employeeId) : req.user?.employee?.id;
  if (!empId) return ApiResponse.badRequest(res, 'Employee ID required');
  return ApiResponse.created(res, await AttendanceService.checkIn(empId, req.userId), 'Checked in');
}));

router.post('/check-out', asyncHandler(async (req, res) => {
  const empId = req.body.employeeId ? parseInt(req.body.employeeId) : req.user?.employee?.id;
  if (!empId) return ApiResponse.badRequest(res, 'Employee ID required');
  return ApiResponse.success(res, await AttendanceService.checkOut(empId), 'Checked out');
}));

router.put('/:id', authorizePermissions('attendance:manage'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await AttendanceService.update(parseInt(req.params.id), req.body), 'Updated');
}));

module.exports = router;
