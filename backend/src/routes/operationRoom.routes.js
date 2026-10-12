const express      = require('express');
const router       = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler = require('../middlewares/asyncHandler');
const ORService    = require('../services/operationRoom.service');
const ApiResponse  = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

router.get('/rooms',          authorizePermissions('or:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await ORService.getRooms());
}));

router.get('/schedule/today', authorizePermissions('or:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await ORService.getTodaySchedule());
}));

router.get('/', authorizePermissions('or:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, date } = req.query;
  const result = await ORService.getAll({ skip, limit, status, date });
  return ApiResponse.paginated(res, result.data, page, limit, result.total);
}));

router.get('/:id', authorizePermissions('or:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await ORService.getById(parseInt(req.params.id)));
}));

router.post('/', authorizePermissions('or:schedule'), auditMiddleware('operation_room'),
  asyncHandler(async (req, res) => {
    return ApiResponse.created(res, await ORService.create(req.body), 'Operation scheduled');
  })
);

router.patch('/:id/status', authorizePermissions('or:update'), auditMiddleware('operation_room'),
  asyncHandler(async (req, res) => {
    const { status, ...rest } = req.body;
    return ApiResponse.success(res, await ORService.updateStatus(parseInt(req.params.id), status, rest), 'Status updated');
  })
);

module.exports = router;
