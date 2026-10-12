const express    = require('express');
const router     = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const RoleController = require('../controllers/role.controller');

router.use(authenticate);
router.get('/permissions/all',  authorizePermissions('roles:view'),   RoleController.getAllPermissions);
router.get('/',                 authorizePermissions('roles:view'),   RoleController.getAll);
router.get('/:id',              authorizePermissions('roles:view'),   RoleController.getById);
router.post('/',                authorizePermissions('roles:manage'), auditMiddleware('roles'), RoleController.create);
router.put('/:id',              authorizePermissions('roles:manage'), auditMiddleware('roles'), RoleController.update);
router.delete('/:id',           authorizePermissions('roles:manage'), auditMiddleware('roles'), RoleController.delete);
router.post('/:id/assign-permissions', authorizePermissions('roles:manage'), auditMiddleware('roles'), RoleController.assignPermissions);

module.exports = router;
