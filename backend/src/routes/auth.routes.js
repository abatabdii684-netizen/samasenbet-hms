const express    = require('express');
const router     = express.Router();
const { body }   = require('express-validator');
const validate   = require('../middlewares/validate');
const { authenticate } = require('../middlewares/auth');
const AuthController   = require('../controllers/auth.controller');

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  AuthController.login
);

// Refresh token
router.post('/refresh-token', AuthController.refreshToken);

// Logout (protected)
router.post('/logout', authenticate, AuthController.logout);

// Get current user (protected)
router.get('/me', authenticate, AuthController.getMe);

// Forgot password
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail().withMessage('Valid email required')],
  validate,
  AuthController.forgotPassword
);

// Reset password
router.post('/reset-password',
  [
    body('token').notEmpty().withMessage('Token required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  AuthController.resetPassword
);

// Change password (protected)
router.patch('/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters'),
  ],
  validate,
  AuthController.changePassword
);

module.exports = router;
