const express    = require('express');
const router     = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler       = require('../middlewares/asyncHandler');
const validateId         = require('../middlewares/validateId');
const InsuranceService   = require('../services/insurance.service');
const ApiResponse        = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);
const canView   = authorizePermissions('insurance:view');
const canManage = authorizePermissions('insurance:manage');

// ── Providers ──────────────────────────────────────────────────
router.get('/providers', canView, asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await InsuranceService.getProviders());
}));

router.post('/providers', canManage, auditMiddleware('insurance'), asyncHandler(async (req, res) => {
  return ApiResponse.created(res, await InsuranceService.createProvider(req.body), 'Provider created');
}));

router.put('/providers/:id', canManage, validateId, auditMiddleware('insurance'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await InsuranceService.updateProvider(req.params.id, req.body), 'Provider updated');
}));

// ── Patient Insurance ──────────────────────────────────────────
router.get('/', canView, asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, providerId, isActive } = req.query;
  const result = await InsuranceService.getAll({ skip, limit, search, providerId, isActive });
  return ApiResponse.paginated(res, result.data, page, limit, result.total);
}));

router.get('/:id', canView, validateId, asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await InsuranceService.getById(req.params.id));
}));

router.post('/', canManage, auditMiddleware('insurance'), asyncHandler(async (req, res) => {
  return ApiResponse.created(res, await InsuranceService.create(req.body), 'Insurance record created');
}));

router.put('/:id', canManage, validateId, auditMiddleware('insurance'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await InsuranceService.update(req.params.id, req.body), 'Insurance updated');
}));

router.patch('/:id/claim', canManage, validateId, auditMiddleware('insurance'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await InsuranceService.processClaim(req.params.id, req.body), 'Claim submitted');
}));

module.exports = router;
