const express      = require('express');
const router       = express.Router();
const path         = require('path');
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const asyncHandler    = require('../middlewares/asyncHandler');
const ReportService   = require('../services/report.service');
const ApiResponse     = require('../utils/apiResponse');

router.use(authenticate, authorizePermissions('reports:view'));

router.get('/daily',      asyncHandler(async (req, res) => ApiResponse.success(res, await ReportService.getDaily(req.query.date))));
router.get('/monthly',    asyncHandler(async (req, res) => ApiResponse.success(res, await ReportService.getMonthly(req.query.month, req.query.year))));
router.get('/revenue',    asyncHandler(async (req, res) => ApiResponse.success(res, await ReportService.getRevenue(req.query.startDate, req.query.endDate))));
router.get('/patients',   asyncHandler(async (req, res) => ApiResponse.success(res, await ReportService.getPatients(req.query.startDate, req.query.endDate))));
router.get('/laboratory', asyncHandler(async (req, res) => ApiResponse.success(res, await ReportService.getLaboratory(req.query.startDate, req.query.endDate))));

router.get('/export/pdf/:type',
  authorizePermissions('reports:export'),
  asyncHandler(async (req, res) => {
    const { filename, filepath } = await ReportService.exportPDF(req.params.type, req.query);
    res.download(filepath, filename);
  })
);

router.get('/export/excel/:type',
  authorizePermissions('reports:export'),
  asyncHandler(async (req, res) => {
    const { filename, filepath } = await ReportService.exportExcel(req.params.type, req.query);
    res.download(filepath, filename);
  })
);

module.exports = router;
