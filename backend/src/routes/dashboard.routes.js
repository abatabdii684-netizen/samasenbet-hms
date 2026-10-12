const express    = require('express');
const router     = express.Router();
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const DashboardController = require('../controllers/dashboard.controller');

router.use(authenticate, authorizePermissions('dashboard:view'));
router.get('/overview',        DashboardController.getOverview);
router.get('/stats',           DashboardController.getStats);
router.get('/charts/patients', DashboardController.getPatientChart);
router.get('/charts/revenue',  DashboardController.getRevenueChart);
router.get('/alerts',          DashboardController.getAlerts);
router.get('/recent-activity', DashboardController.getRecentActivity);

module.exports = router;
