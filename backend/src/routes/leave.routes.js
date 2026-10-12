const express      = require('express');
const router       = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler  = require('../middlewares/asyncHandler');
const LeaveService  = require('../services/leave.service');
const ApiResponse   = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

// ── specific routes BEFORE /:id ──────────────────────────────────
router.get('/types', asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await LeaveService.getLeaveTypes());
}));

router.get('/', authorizePermissions('leave:apply'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, employeeId } = req.query;
  const { data, total } = await LeaveService.getAll({ skip, limit, status, employeeId });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.get('/:id', authorizePermissions('leave:apply'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await LeaveService.getById(parseInt(req.params.id)));
}));

router.post('/', authorizePermissions('leave:apply'), auditMiddleware('leave'),
  asyncHandler(async (req, res) => {
    // HR/admin can submit on behalf of any employee via req.body.employeeId
    // otherwise use the logged-in user's own employee profile
    const empId = req.body.employeeId
      ? parseInt(req.body.employeeId)
      : req.user?.employee?.id;

    if (!empId) return ApiResponse.badRequest(res, 'Employee profile required. Please select an employee.');
    return ApiResponse.created(res, await LeaveService.create(req.body, empId), 'Leave request submitted');
  })
);

router.patch('/:id/approve', authorizePermissions('leave:approve'), auditMiddleware('leave'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await LeaveService.approve(parseInt(req.params.id), req.userId), 'Leave approved');
  })
);

router.patch('/:id/reject', authorizePermissions('leave:approve'), auditMiddleware('leave'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await LeaveService.reject(parseInt(req.params.id), req.userId, req.body.rejectionNote), 'Leave rejected');
  })
);

router.delete('/:id', authorizePermissions('leave:apply'), auditMiddleware('leave'),
  asyncHandler(async (req, res) => {
    const empId = req.body.employeeId
      ? parseInt(req.body.employeeId)
      : req.user?.employee?.id;
    return ApiResponse.success(res, await LeaveService.cancel(parseInt(req.params.id), empId), 'Leave cancelled');
  })
);

module.exports = router;
