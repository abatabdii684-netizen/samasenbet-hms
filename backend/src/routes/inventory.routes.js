const express      = require('express');
const router       = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler     = require('../middlewares/asyncHandler');
const InventoryService = require('../services/inventory.service');
const ApiResponse      = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

router.get('/categories', authorizePermissions('inventory:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await InventoryService.getCategories());
}));

router.get('/low-stock', authorizePermissions('inventory:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await InventoryService.getLowStock());
}));

router.get('/', authorizePermissions('inventory:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, categoryId } = req.query;
  const { data, total } = await InventoryService.getAll({ skip, limit, search, categoryId });
  return ApiResponse.paginated(res, data, page, limit, total);
}));

router.get('/:id', authorizePermissions('inventory:view'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await InventoryService.getById(parseInt(req.params.id)));
}));

router.post('/', authorizePermissions('inventory:manage'), auditMiddleware('inventory'),
  asyncHandler(async (req, res) => {
    return ApiResponse.created(res, await InventoryService.create(req.body), 'Item created');
  })
);

router.put('/:id', authorizePermissions('inventory:manage'), auditMiddleware('inventory'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await InventoryService.update(parseInt(req.params.id), req.body), 'Item updated');
  })
);

router.delete('/:id', authorizePermissions('inventory:manage'), auditMiddleware('inventory'),
  asyncHandler(async (req, res) => {
    await InventoryService.delete(parseInt(req.params.id));
    return ApiResponse.success(res, null, 'Item removed');
  })
);

router.post('/:id/stock-in', authorizePermissions('inventory:manage'), auditMiddleware('inventory'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await InventoryService.stockIn(parseInt(req.params.id), req.body, req.userId), 'Stock added');
  })
);

router.post('/:id/stock-out', authorizePermissions('inventory:manage'), auditMiddleware('inventory'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await InventoryService.stockOut(parseInt(req.params.id), req.body, req.userId), 'Stock removed');
  })
);

module.exports = router;
