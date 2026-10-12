const express      = require('express');
const router       = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler     = require('../middlewares/asyncHandler');
const AdmissionService = require('../services/admission.service');
const ApiResponse      = require('../utils/apiResponse');
const resolveEmployee  = require('../utils/resolveEmployee');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

router.get('/active', authorizePermissions('admissions:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await AdmissionService.getActive());
}));

router.get('/', authorizePermissions('admissions:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, status, wardId } = req.query;
  const { data, total } = await AdmissionService.getAll({ skip, limit, search, status, wardId });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.get('/:id', authorizePermissions('admissions:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await AdmissionService.getById(parseInt(req.params.id)));
}));

router.post('/', authorizePermissions('admissions:create'), auditMiddleware('admissions'),
  asyncHandler(async (req, res) => {
    let admittingDoctorId = await resolveEmployee(req.userId);

    // If admin has no employee profile, use doctorId from request body
    if (!admittingDoctorId && req.body.admittingDoctorId) {
      admittingDoctorId = parseInt(req.body.admittingDoctorId);
    }

    // Last resort: find any active employee
    if (!admittingDoctorId) {
      const { prisma } = require('../config/database');
      const anyEmployee = await prisma.employee.findFirst({
        where: { status: 'ACTIVE' },
        orderBy: { id: 'asc' },
      });
      admittingDoctorId = anyEmployee?.id || null;
    }

    return ApiResponse.created(res,
      await AdmissionService.create(req.body, admittingDoctorId),
      'Patient admitted'
    );
  })
);

router.patch('/:id/discharge', authorizePermissions('admissions:discharge'), auditMiddleware('admissions'),
  asyncHandler(async (req, res) => {
    const dischargedById = await resolveEmployee(req.userId);
    return ApiResponse.success(res,
      await AdmissionService.discharge(parseInt(req.params.id), req.body, dischargedById),
      'Patient discharged'
    );
  })
);

router.patch('/:id/transfer', authorizePermissions('admissions:create'), auditMiddleware('admissions'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res,
      await AdmissionService.transfer(parseInt(req.params.id), req.body),
      'Patient transferred'
    );
  })
);

module.exports = router;
