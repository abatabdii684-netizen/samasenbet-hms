const express    = require('express');
const router     = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler = require('../middlewares/asyncHandler');
const OpdService   = require('../services/opd.service');
const ApiResponse  = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

router.get('/clinic/:clinicType', authorizePermissions('opd:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { data, total } = await OpdService.getByClinic(req.params.clinicType, { skip, limit });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.get('/', authorizePermissions('opd:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, status, clinicType, doctorId, date, patientId } = req.query;
  const { data, total } = await OpdService.getAll({ skip, limit, search, status, clinicType, doctorId, date, patientId });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.get('/:id', authorizePermissions('opd:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await OpdService.getById(parseInt(req.params.id)));
}));

router.post('/', authorizePermissions('opd:create'), auditMiddleware('opd'), asyncHandler(async (req, res) => {
  // Resolve doctorId from logged-in user's employee profile
  const { prisma } = require('../config/database');
  const employee = await prisma.employee.findFirst({ where: { userId: req.userId } });

  // If no employee profile (e.g. admin), use doctorId from request body
  // or fall back to any available doctor
  let doctorId = employee?.id || null;

  if (!doctorId && req.body.doctorId) {
    doctorId = parseInt(req.body.doctorId);
  }

  if (!doctorId) {
    // Last resort: find the first employee with a doctor-related job title
    const anyDoctor = await prisma.employee.findFirst({
      where: {
        status: 'ACTIVE',
        OR: [
          { jobTitle: { contains: 'Doctor'  } },
          { jobTitle: { contains: 'Physician' } },
          { jobTitle: { contains: 'Surgeon'  } },
          { user: { role: { name: { in: ['DOCTOR','MEDICAL_DIRECTOR','MEDICAL_SUPERVISOR','OPD_HEAD'] } } } },
        ],
      },
      orderBy: { id: 'asc' },
      include: { user: { include: { role: true } } },
    });
    if (!anyDoctor) return ApiResponse.badRequest(res, 'No doctor found. Please add an employee with a doctor role first.');
    doctorId = anyDoctor.id;
  }

  const visit = await OpdService.create(req.body, doctorId);
  return ApiResponse.created(res, visit, 'Visit created');
}));

router.patch('/:id/diagnose', authorizePermissions('opd:diagnose'), auditMiddleware('opd'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await OpdService.diagnose(parseInt(req.params.id), req.body), 'Diagnosis saved');
}));

router.patch('/:id/discharge', authorizePermissions('opd:diagnose'), auditMiddleware('opd'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await OpdService.discharge(parseInt(req.params.id), req.body), 'Patient discharged');
}));

module.exports = router;
