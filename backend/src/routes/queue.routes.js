const express      = require('express');
const router       = express.Router();
const { body }     = require('express-validator');
const validate     = require('../middlewares/validate');
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const asyncHandler = require('../middlewares/asyncHandler');
const QueueService = require('../services/queue.service');
const ApiResponse  = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);
const canView = authorizePermissions('patients:view');

// GET /queues/active
router.get('/active', canView, asyncHandler(async (req, res) => {
  const data = await QueueService.getActive();
  return ApiResponse.success(res, data);
}));

// GET /queues/stats
router.get('/stats', canView, asyncHandler(async (req, res) => {
  const data = await QueueService.getStats(req.query.clinicType);
  return ApiResponse.success(res, data);
}));

// GET /queues
router.get('/', canView, asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { date, clinicType, status } = req.query;
  const result = await QueueService.getAll({ skip, limit, date, clinicType, status });
  return ApiResponse.paginated(res, result.data, page, limit, result.total);
}));

// GET /queues/:id
router.get('/:id', canView, asyncHandler(async (req, res) => {
  const { prisma } = require('../config/database');
  const entry = await prisma.queue.findUnique({
    where: { id: parseInt(req.params.id) },
    include: {
      patient: { select: { id: true, patientId: true, firstName: true, lastName: true, phone: true } },
    },
  });
  if (!entry) return ApiResponse.notFound(res, 'Queue entry not found');
  return ApiResponse.success(res, entry);
}));

// POST /queues
router.post('/',
  canView,
  [
    body('patientId').isInt({ min: 1 }).withMessage('Patient is required'),
    body('clinicType').notEmpty().withMessage('Clinic type is required'),
  ],
  validate,
  asyncHandler(async (req, res) => {
    const entry = await QueueService.create(req.body);
    return ApiResponse.created(res, entry, 'Patient added to queue');
  })
);

// PATCH /queues/call-next
router.patch('/call-next', canView, asyncHandler(async (req, res) => {
  const { clinicType } = req.body;
  if (!clinicType) return ApiResponse.badRequest(res, 'clinicType is required');
  const next = await QueueService.callNext(clinicType);
  return ApiResponse.success(res, next, next ? 'Next patient called' : 'No patients waiting');
}));

// PATCH /queues/:id/status
router.patch('/:id/status', canView, asyncHandler(async (req, res) => {
  const { status } = req.body;
  if (!status) return ApiResponse.badRequest(res, 'status is required');
  const entry = await QueueService.updateStatus(parseInt(req.params.id), status);
  return ApiResponse.success(res, entry, 'Status updated');
}));

module.exports = router;
