const express      = require('express');
const router       = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler     = require('../middlewares/asyncHandler');
const DeliveryService  = require('../services/delivery.service');
const ApiResponse      = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

router.get('/', authorizePermissions('delivery:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { status, date } = req.query;
  const result = await DeliveryService.getAll({ skip, limit, status, date });
  return ApiResponse.paginated(res, result.data, page, limit, result.total);
}));

router.get('/:id', authorizePermissions('delivery:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await DeliveryService.getById(parseInt(req.params.id)));
}));

router.post('/', authorizePermissions('delivery:create'), auditMiddleware('delivery'),
  asyncHandler(async (req, res) => {
    return ApiResponse.created(res, await DeliveryService.create(req.body, req.userId), 'Delivery recorded');
  })
);

router.put('/:id', authorizePermissions('delivery:update'), auditMiddleware('delivery'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await DeliveryService.update(parseInt(req.params.id), req.body), 'Record updated');
  })
);

module.exports = router;
