/**
 * Main API Router
 * Yohannes Fantaye Metasebiya General Hospital PLC — HMS
 */

const express = require('express');
const router = express.Router();

// ─── Module Routes ────────────────────────────────────────────────────────────
const authRoutes           = require('./auth.routes');
const userRoutes           = require('./user.routes');
const roleRoutes           = require('./role.routes');
const departmentRoutes     = require('./department.routes');
const patientRoutes        = require('./patient.routes');
const appointmentRoutes    = require('./appointment.routes');
const queueRoutes          = require('./queue.routes');
const triageRoutes         = require('./triage.routes');
const opdRoutes            = require('./opd.routes');
const laboratoryRoutes     = require('./laboratory.routes');
const pharmacyRoutes       = require('./pharmacy.routes');
const inventoryRoutes      = require('./inventory.routes');
const billingRoutes        = require('./billing.routes');
const paymentRoutes        = require('./payment.routes');
const insuranceRoutes      = require('./insurance.routes');
const admissionRoutes      = require('./admission.routes');
const wardRoutes           = require('./ward.routes');
const bedRoutes            = require('./bed.routes');
const operationRoomRoutes  = require('./operationRoom.routes');
const deliveryRoutes       = require('./delivery.routes');
const employeeRoutes       = require('./employee.routes');
const attendanceRoutes     = require('./attendance.routes');
const leaveRoutes          = require('./leave.routes');
const payrollRoutes        = require('./payroll.routes');
const reportRoutes         = require('./report.routes');
const dashboardRoutes      = require('./dashboard.routes');
const notificationRoutes   = require('./notification.routes');
const auditLogRoutes       = require('./auditLog.routes');
const backupRoutes         = require('./backup.routes');

// ─── Route Mounting ───────────────────────────────────────────────────────────
router.use('/auth',           authRoutes);
router.use('/users',          userRoutes);
router.use('/roles',          roleRoutes);
router.use('/departments',    departmentRoutes);
router.use('/patients',       patientRoutes);
router.use('/appointments',   appointmentRoutes);
router.use('/queues',         queueRoutes);
router.use('/triage',         triageRoutes);
router.use('/opd',            opdRoutes);
router.use('/laboratory',     laboratoryRoutes);
router.use('/pharmacy',       pharmacyRoutes);
router.use('/inventory',      inventoryRoutes);
router.use('/billing',        billingRoutes);
router.use('/payments',       paymentRoutes);
router.use('/insurance',      insuranceRoutes);
router.use('/admissions',     admissionRoutes);
router.use('/wards',          wardRoutes);
router.use('/beds',           bedRoutes);
router.use('/operation-rooms', operationRoomRoutes);
router.use('/deliveries',     deliveryRoutes);
router.use('/employees',      employeeRoutes);
router.use('/attendance',     attendanceRoutes);
router.use('/leaves',         leaveRoutes);
router.use('/payroll',        payrollRoutes);
router.use('/reports',        reportRoutes);
router.use('/dashboard',      dashboardRoutes);
router.use('/notifications',  notificationRoutes);
router.use('/audit-logs',     auditLogRoutes);
router.use('/backup',         backupRoutes);

module.exports = router;
