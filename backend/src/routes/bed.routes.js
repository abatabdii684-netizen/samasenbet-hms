const express    = require('express');
const router     = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler = require('../middlewares/asyncHandler');
const { BedService } = require('../services/ward.service');
const ApiResponse    = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

router.get('/available', authorizePermissions('beds:manage'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await BedService.getAvailable(req.query.wardId));
}));

router.get('/', authorizePermissions('beds:manage'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { wardId, status } = req.query;
  const result = await BedService.getAll({ skip, limit, wardId, status });
  return ApiResponse.paginated(res, result.data, page, limit, result.total);
}));

router.post('/', authorizePermissions('beds:manage'), auditMiddleware('beds'),
  asyncHandler(async (req, res) => {
    return ApiResponse.created(res, await BedService.create(req.body), 'Bed created');
  })
);

router.put('/:id', authorizePermissions('beds:manage'), auditMiddleware('beds'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await BedService.update(parseInt(req.params.id), req.body), 'Bed updated');
  })
);

router.patch('/:id/status', authorizePermissions('beds:manage'), auditMiddleware('beds'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await BedService.updateStatus(parseInt(req.params.id), req.body.status), 'Bed status updated');
  })
);

module.exports = router;
