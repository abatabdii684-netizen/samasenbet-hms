const express    = require('express');
const router     = express.Router();
const { body }   = require('express-validator');
const validate   = require('../middlewares/validate');
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const asyncHandler   = require('../middlewares/asyncHandler');
const UserController = require('../controllers/user.controller');
const UserService    = require('../services/user.service');
const ApiResponse    = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

router.use(authenticate);

router.get('/', authorizePermissions('users:view'), asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationParams(req.query);
  const { search, roleId, isActive } = req.query;
  const { data, total } = await UserService.getAll({ skip, limit, search, roleId, isActive });
  return ApiResponse.paginated(res, data, page, limit, total);
}));
router.get('/:id', authorizePermissions('users:view'),   UserController.getById);

router.post('/',
  authorizePermissions('users:create'),
  auditMiddleware('users'),
  [
    body('username').trim().notEmpty().withMessage('Username required'),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password min 8 chars'),
    body('roleId').isInt().withMessage('Role required'),
  ],
  validate,
  UserController.create
);

router.put('/:id',
  authorizePermissions('users:update'),
  auditMiddleware('users'),
  UserController.update
);

router.patch('/:id/toggle-status',
  authorizePermissions('users:update'),
  auditMiddleware('users'),
  UserController.toggleStatus
);

router.delete('/:id',
  authorizePermissions('users:delete'),
  auditMiddleware('users'),
  UserController.delete
);

module.exports = router;
