const express      = require('express');
const router       = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler    = require('../middlewares/asyncHandler');
const validateId      = require('../middlewares/validateId');
const LabService      = require('../services/laboratory.service');
const ApiResponse     = require('../utils/apiResponse');
const resolveEmployee = require('../utils/resolveEmployee');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

// Test catalog
router.get('/tests/all', authorizePermissions('lab:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, category } = req.query;
  const { data, total } = await LabService.getAllTests({ skip, limit, search, category });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.post('/tests', authorizePermissions('lab:manage_catalog'), auditMiddleware('laboratory'),
  asyncHandler(async (req, res) => {
    return ApiResponse.created(res, await LabService.createTest(req.body), 'Test created');
  })
);

// Orders
router.get('/', authorizePermissions('lab:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, status, date } = req.query;
  const { data, total } = await LabService.getAll({ skip, limit, search, status, date });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.post('/', authorizePermissions('lab:create'), auditMiddleware('laboratory'),
  asyncHandler(async (req, res) => {
    const doctorId = await resolveEmployee(req.userId);
    return ApiResponse.created(res, await LabService.create(req.body, doctorId), 'Lab order created');
  })
);

router.get('/:id', authorizePermissions('lab:view'), validateId, asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await LabService.getById(req.params.id));
}));

router.patch('/:id/results', authorizePermissions('lab:enter_results'), validateId, auditMiddleware('laboratory'),
  asyncHandler(async (req, res) => {
    const technicianId = await resolveEmployee(req.userId);
    const order = await LabService.enterResults(req.params.id, req.body.results, technicianId);
    return ApiResponse.success(res, order, 'Results entered');
  })
);

router.patch('/:id/approve', authorizePermissions('lab:approve'), validateId, auditMiddleware('laboratory'),
  asyncHandler(async (req, res) => {
    const approvedById = await resolveEmployee(req.userId);
    return ApiResponse.success(res, await LabService.approve(req.params.id, approvedById), 'Result approved');
  })
);

module.exports = router;
