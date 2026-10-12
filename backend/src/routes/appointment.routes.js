const express    = require('express');
const router     = express.Router();
const { body }   = require('express-validator');
const validate   = require('../middlewares/validate');
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const AppointmentController = require('../controllers/appointment.controller');

router.use(authenticate);
router.get('/today',            authorizePermissions('appointments:view'),   AppointmentController.getToday);
router.get('/',                 authorizePermissions('appointments:view'),   AppointmentController.getAll);
router.get('/doctor/:doctorId', authorizePermissions('appointments:view'),   AppointmentController.getByDoctor);
router.get('/:id',              authorizePermissions('appointments:view'),   AppointmentController.getById);

router.post('/',
  authorizePermissions('appointments:create'),
  auditMiddleware('appointments'),
  [
    body('patientId').isInt().withMessage('Patient required'),
    body('doctorId').isInt().withMessage('Doctor required'),
    body('clinicType').notEmpty().withMessage('Clinic type required'),
    body('scheduledAt').isISO8601().withMessage('Valid scheduled time required'),
  ],
  validate,
  AppointmentController.create
);

router.put('/:id',           authorizePermissions('appointments:update'), auditMiddleware('appointments'), AppointmentController.update);
router.patch('/:id/status',  authorizePermissions('appointments:update'), auditMiddleware('appointments'), AppointmentController.updateStatus);
router.delete('/:id',        authorizePermissions('appointments:delete'), auditMiddleware('appointments'), AppointmentController.delete);

module.exports = router;
