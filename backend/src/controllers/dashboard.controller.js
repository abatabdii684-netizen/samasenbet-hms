const asyncHandler      = require('../middlewares/asyncHandler');
const DashboardService  = require('../services/dashboard.service');
const ApiResponse       = require('../utils/apiResponse');

class DashboardController {
  getOverview       = asyncHandler(async (req, res) => ApiResponse.success(res, await DashboardService.getOverview()));
  getStats          = asyncHandler(async (req, res) => ApiResponse.success(res, await DashboardService.getOverview()));
  getPatientChart   = asyncHandler(async (req, res) => ApiResponse.success(res, await DashboardService.getPatientChart()));
  getRevenueChart   = asyncHandler(async (req, res) => ApiResponse.success(res, await DashboardService.getRevenueChart()));
  getAlerts         = asyncHandler(async (req, res) => ApiResponse.success(res, await DashboardService.getAlerts()));
  getRecentActivity = asyncHandler(async (req, res) => ApiResponse.success(res, await DashboardService.getRecentActivity()));
}

module.exports = new DashboardController();
