const express    = require('express');
const router     = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler = require('../middlewares/asyncHandler');
const { WardService } = require('../services/ward.service');
const ApiResponse     = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

router.get('/', authorizePermissions('wards:manage'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search } = req.query;
  const result = await WardService.getAll({ skip, limit, search });
  return ApiResponse.paginated(res, result.data, page, limit, result.total);
}));

router.get('/:id', authorizePermissions('wards:manage'), asyncHandler(async (req, res) => {
  return ApiResponse.success(res, await WardService.getById(parseInt(req.params.id)));
}));

router.post('/', authorizePermissions('wards:manage'), auditMiddleware('wards'),
  asyncHandler(async (req, res) => {
    return ApiResponse.created(res, await WardService.create(req.body), 'Ward created');
  })
);

router.put('/:id', authorizePermissions('wards:manage'), auditMiddleware('wards'),
  asyncHandler(async (req, res) => {
    return ApiResponse.success(res, await WardService.update(parseInt(req.params.id), req.body), 'Ward updated');
  })
);

router.get('/:id/beds', authorizePermissions('beds:manage'), asyncHandler(async (req, res) => {
  const ward = await WardService.getById(parseInt(req.params.id));
  return ApiResponse.success(res, ward.beds);
}));

module.exports = router;
