const express      = require('express');
const router       = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler    = require('../middlewares/asyncHandler');
const PayrollService  = require('../services/payroll.service');
const ApiResponse     = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

// ── specific routes BEFORE /:id ──────────────────────────────────
router.get('/', authorizePermissions('payroll:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { month, year, status, employeeId } = req.query;
  const { data, total } = await PayrollService.getAll({ skip, limit, month, year, status, employeeId });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.post('/generate', authorizePermissions('payroll:manage'), auditMiddleware('payroll'),
  asyncHandler(async (req, res) => {
    const { month, year, employeeId } = req.body;
    if (!month || !year) return ApiResponse.badRequest(res, 'Month and year are required');
    const generated = await PayrollService.generate(parseInt(month), parseInt(year), employeeId === 'ALL' ? null : employeeId);
    return ApiResponse.created(res, generated, `Generated ${generated.length} payroll record(s)`);
  })
);

// ── param routes AFTER specific ones ─────────────────────────────
router.get('/:id', authorizePermissions('payroll:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await PayrollService.getById(parseInt(req.params.id)));
}));

router.patch('/:id/approve', authorizePermissions('payroll:manage'), auditMiddleware('payroll'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await PayrollService.approve(parseInt(req.params.id), req.userId), 'Payroll approved');
  })
);

router.patch('/:id/pay', authorizePermissions('payroll:manage'), auditMiddleware('payroll'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await PayrollService.markPaid(parseInt(req.params.id), req.body.paymentRef), 'Payroll marked as paid');
  })
);

module.exports = router;
