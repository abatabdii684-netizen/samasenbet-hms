const express    = require('express');
const router     = express.Router();
const { body }   = require('express-validator');
const validate   = require('../middlewares/validate');
const { authenticate, authorizePermissions } = require('../middlewares/auth');
const { auditMiddleware } = require('../middlewares/auditLog');
const PatientController  = require('../controllers/patient.controller');

router.use(authenticate);

const createRules = [
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('dateOfBirth').isDate().withMessage('Valid date of birth required'),
  body('gender').isIn(['MALE','FEMALE','OTHER']).withMessage('Valid gender required'),
  body('phone').trim().notEmpty().withMessage('Phone number required'),
];

router.get('/',              authorizePermissions('patients:view'),   PatientController.getAll);
router.get('/:id',           authorizePermissions('patients:view'),   PatientController.getById);
router.get('/:id/history',   authorizePermissions('patients:view'),   PatientController.getHistory);
router.get('/:id/visits',    authorizePermissions('patients:view'),   PatientController.getVisits);
router.get('/:id/prescriptions', authorizePermissions('patients:view'), PatientController.getPrescriptions);
router.get('/:id/lab-results',   authorizePermissions('patients:view'), PatientController.getLabResults);
router.get('/:id/billing',   authorizePermissions('billing:view'),   PatientController.getBilling);

router.post('/',
  authorizePermissions('patients:create'),
  auditMiddleware('patients'),
  createRules, validate,
  PatientController.create
);

router.put('/:id',
  authorizePermissions('patients:update'),
  auditMiddleware('patients'),
  PatientController.update
);

router.delete('/:id',
  authorizePermissions('patients:delete'),
  auditMiddleware('patients'),
  PatientController.delete
);

module.exports = router;
