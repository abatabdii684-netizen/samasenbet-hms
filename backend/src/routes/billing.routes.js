const express      = require('express');
const router       = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler   = require('../middlewares/asyncHandler');
const BillingService = require('../services/billing.service');
const ApiResponse    = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

router.get('/', authorizePermissions('billing:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, status, visitId } = req.query;
  const { data, total } = await BillingService.getAll({ skip, limit, search, status, visitId });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.get('/:id', authorizePermissions('billing:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await BillingService.getById(parseInt(req.params.id)));
}));

router.post('/', authorizePermissions('billing:create'), auditMiddleware('billing'),
  asyncHandler(async (req, res) => {
    return ApiResponse.created(res, await BillingService.create(req.body, req.userId), 'Bill created');
  })
);

router.post('/:id/items', authorizePermissions('billing:update'), auditMiddleware('billing'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await BillingService.addItem(parseInt(req.params.id), req.body), 'Item added');
  })
);

router.delete('/:id/items/:itemId', authorizePermissions('billing:update'), auditMiddleware('billing'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await BillingService.removeItem(parseInt(req.params.id), parseInt(req.params.itemId)), 'Item removed');
  })
);

router.patch('/:id/finalize', authorizePermissions('billing:finalize'), auditMiddleware('billing'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await BillingService.finalize(parseInt(req.params.id)), 'Bill finalized');
  })
);

module.exports = router;
