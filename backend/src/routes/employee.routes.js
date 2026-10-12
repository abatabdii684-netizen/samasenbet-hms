const express      = require('express');
const router       = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler     = require('../middlewares/asyncHandler');
const EmployeeService  = require('../services/employee.service');
const ApiResponse      = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

// ── specific routes BEFORE /:id ──────────────────────────────────
router.get('/department/:dept', authorizePermissions('employees:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await EmployeeService.getByDepartment(req.params.dept));
}));

router.get('/', authorizePermissions('employees:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, departmentId, status, employmentType } = req.query;
  const { data, total } = await EmployeeService.getAll({ skip, limit, search, departmentId, status, employmentType });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.get('/:id', authorizePermissions('employees:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await EmployeeService.getById(parseInt(req.params.id)));
}));

router.get('/:id/attendance', authorizePermissions('attendance:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { data, total } = await EmployeeService.getAttendance(parseInt(req.params.id), { skip, limit });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.get('/:id/leaves', authorizePermissions('leave:apply'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await EmployeeService.getLeaves(parseInt(req.params.id)));
}));

router.get('/:id/payslips', authorizePermissions('payroll:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await EmployeeService.getPayslips(parseInt(req.params.id)));
}));

router.post('/', authorizePermissions('employees:create'), auditMiddleware('employees'),
  asyncHandler(async (req, res) => {
    return ApiResponse.created(res, await EmployeeService.create(req.body), 'Employee added');
  })
);

router.put('/:id', authorizePermissions('employees:update'), auditMiddleware('employees'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await EmployeeService.update(parseInt(req.params.id), req.body), 'Employee updated');
  })
);

router.patch('/:id/toggle-status', authorizePermissions('employees:update'), auditMiddleware('employees'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await EmployeeService.toggleStatus(parseInt(req.params.id)));
  })
);

module.exports = router;
