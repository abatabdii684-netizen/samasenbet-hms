const asyncHandler = require('../middlewares/asyncHandler');
const RoleService  = require('../services/role.service');
const ApiResponse  = require('../utils/apiResponse');

class RoleController {
  getAll = asyncHandler(async (req, res) => {
    const roles = await RoleService.getAll();
    return ApiResponse.success(res, roles);
  });

  getById = asyncHandler(async (req, res) => {
    const role = await RoleService.getById(parseInt(req.params.id));
    return ApiResponse.success(res, role);
  });

  create = asyncHandler(async (req, res) => {
    const role = await RoleService.create(req.body);
    return ApiResponse.created(res, role, 'Role created successfully');
  });

  update = asyncHandler(async (req, res) => {
    const role = await RoleService.update(parseInt(req.params.id), req.body);
    return ApiResponse.success(res, role, 'Role updated successfully');
  });

  delete = asyncHandler(async (req, res) => {
    await RoleService.delete(parseInt(req.params.id));
    return ApiResponse.success(res, null, 'Role deleted successfully');
  });

  getAllPermissions = asyncHandler(async (req, res) => {
    const permissions = await RoleService.getAllPermissions();
    return ApiResponse.success(res, permissions);
  });

  assignPermissions = asyncHandler(async (req, res) => {
    const role = await RoleService.assignPermissions(parseInt(req.params.id), req.body.permissionIds);
    return ApiResponse.success(res, role, 'Permissions assigned successfully');
  });
}

module.exports = new RoleController();
