const express    = require('express');
const router     = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler    = require('../middlewares/asyncHandler');
const TriageService   = require('../services/triage.service');
const ApiResponse     = require('../utils/apiResponse');
const resolveEmployee = require('../utils/resolveEmployee');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

router.get('/', authorizePermissions('triage:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, priority, date } = req.query;
  const { data, total } = await TriageService.getAll({ skip, limit, search, priority, date });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.get('/:id', authorizePermissions('triage:view'), asyncHandler(async (req, res) => {
  const t = await TriageService.getById(parseInt(req.params.id));
  return ApiResponse.success(res, t);
}));

router.post('/',
  authorizePermissions('triage:create'),
  auditMiddleware('triage'),
  asyncHandler(async (req, res) => {
    const nurseId = await resolveEmployee(req.userId);
    const t = await TriageService.create(req.body, nurseId);
    return ApiResponse.created(res, t, 'Triage recorded');
  })
);

router.put('/:id',
  authorizePermissions('triage:update'),
  auditMiddleware('triage'),
  asyncHandler(async (req, res) => {
    const t = await TriageService.update(parseInt(req.params.id), req.body);
    return ApiResponse.success(res, t, 'Triage updated');
  })
);

module.exports = router;
