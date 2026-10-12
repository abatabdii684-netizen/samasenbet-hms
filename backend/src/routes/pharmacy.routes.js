const express      = require('express');
const router       = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler    = require('../middlewares/asyncHandler');
const PharmacyService = require('../services/pharmacy.service');
const ApiResponse     = require('../utils/apiResponse');
const resolveEmployee = require('../utils/resolveEmployee');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

// Drug catalog
router.get('/drugs/low-stock', authorizePermissions('pharmacy:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await PharmacyService.getLowStock());
}));

router.get('/drugs/expiring', authorizePermissions('pharmacy:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await PharmacyService.getExpiring(parseInt(req.query.days) || 30));
}));

router.get('/drugs/all', authorizePermissions('pharmacy:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, category } = req.query;
  const { data, total } = await PharmacyService.getAllDrugs({ skip, limit, search, category });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.post('/drugs', authorizePermissions('pharmacy:manage_drugs'), auditMiddleware('pharmacy'),
  asyncHandler(async (req, res) => {
    return ApiResponse.created(res, await PharmacyService.createDrug(req.body), 'Drug added');
  })
);

router.put('/drugs/:id', authorizePermissions('pharmacy:manage_drugs'), auditMiddleware('pharmacy'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await PharmacyService.updateDrug(parseInt(req.params.id), req.body), 'Drug updated');
  })
);

router.post('/drugs/stock', authorizePermissions('pharmacy:manage_stock'), auditMiddleware('pharmacy'),
  asyncHandler(async (req, res) => {
    return ApiResponse.created(res, await PharmacyService.addStock(req.body), 'Stock added');
  })
);

// Prescriptions
router.get('/', authorizePermissions('pharmacy:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, status } = req.query;
  const { data, total } = await PharmacyService.getAll({ skip, limit, search, status });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

// POST /pharmacy or /pharmacy/prescriptions — create prescription from OPD visit
router.post('/', authorizePermissions('opd:prescribe'), auditMiddleware('pharmacy'),
  asyncHandler(async (req, res) => {
    const doctorId = await resolveEmployee(req.userId);
    const rx = await PharmacyService.create({ ...req.body, doctorId });
    if (req.body.visitId) {
      const { prisma } = require('../config/database');
      await prisma.visit.update({
        where: { id: parseInt(req.body.visitId) },
        data:  { status: 'PENDING_PHARMACY' },
      });
    }
    return ApiResponse.created(res, rx, 'Prescription written successfully');
  })
);

router.post('/prescriptions', authorizePermissions('opd:prescribe'), auditMiddleware('pharmacy'),
  asyncHandler(async (req, res) => {
    const doctorId = await resolveEmployee(req.userId);
    const rx = await PharmacyService.create({ ...req.body, doctorId });
    if (req.body.visitId) {
      const { prisma } = require('../config/database');
      await prisma.visit.update({
        where: { id: parseInt(req.body.visitId) },
        data:  { status: 'PENDING_PHARMACY' },
      });
    }
    return ApiResponse.created(res, rx, 'Prescription written successfully');
  })
);

router.get('/:id', authorizePermissions('pharmacy:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await PharmacyService.getById(parseInt(req.params.id)));
}));

router.patch('/:id/dispense', authorizePermissions('pharmacy:dispense'), auditMiddleware('pharmacy'),
  asyncHandler(async (req, res) => {
    // pharmacistId is an Employee FK — resolve from user's employee profile
    const pharmacistId = await resolveEmployee(req.userId);
    return ApiResponse.success(res,
      await PharmacyService.dispense(parseInt(req.params.id), pharmacistId),
      'Medications dispensed'
    );
  })
);

module.exports = router;
