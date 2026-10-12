const express      = require('express');
const router       = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler    = require('../middlewares/asyncHandler');
const PaymentService  = require('../services/payment.service');
const ApiResponse     = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

router.get('/', authorizePermissions('billing:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, method, status } = req.query;
  const { data, total } = await PaymentService.getAll({ skip, limit, search, method, status });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.get('/:id', authorizePermissions('billing:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await PaymentService.getById(parseInt(req.params.id)));
}));

router.post('/', authorizePermissions('payments:receive'), auditMiddleware('payments'),
  asyncHandler(async (req, res) => {
    return ApiResponse.created(res, await PaymentService.create(req.body, req.userId), 'Payment recorded');
  })
);

router.patch('/:id/refund', authorizePermissions('payments:refund'), auditMiddleware('payments'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await PaymentService.refund(parseInt(req.params.id), req.body.reason), 'Payment refunded');
  })
);

module.exports = router;
