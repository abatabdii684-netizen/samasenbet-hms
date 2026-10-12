const asyncHandler = require('../middlewares/asyncHandler');
const UserService  = require('../services/user.service');
const ApiResponse  = require('../utils/apiResponse');
const { getPaginationParams } = require('../utils/helpers');

class UserController {
  getAll = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPaginationParams(req.query);
    const { search, roleId, isActive } = req.query;
    const { data, total } = await UserService.getAll({ skip, limit, search, roleId, isActive });
    return ApiResponse.paginated(res, data, page, limit, total);
  });

  getById = asyncHandler(async (req, res) => {
    const user = await UserService.getById(parseInt(req.params.id));
    return ApiResponse.success(res, user);
  });

  create = asyncHandler(async (req, res) => {
    const user = await UserService.create(req.body, req.userId);
    return ApiResponse.created(res, user, 'User created successfully');
  });

  update = asyncHandler(async (req, res) => {
    const user = await UserService.update(parseInt(req.params.id), req.body, req.userId);
    return ApiResponse.success(res, user, 'User updated successfully');
  });

  toggleStatus = asyncHandler(async (req, res) => {
    const user = await UserService.toggleStatus(parseInt(req.params.id));
    return ApiResponse.success(res, user, `User ${user.isActive ? 'activated' : 'deactivated'}`);
  });

  delete = asyncHandler(async (req, res) => {
    await UserService.delete(parseInt(req.params.id));
    return ApiResponse.success(res, null, 'User deleted successfully');
  });
}

module.exports = new UserController();
