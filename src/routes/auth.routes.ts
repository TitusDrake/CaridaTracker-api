import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { PasswordResetController } from '../controllers/passwordReset.controller';
import { EmailVerificationController } from '../controllers/emailVerification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { body } from 'express-validator';

const router = Router();

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Invalid email address'),
  body('username')
    .isLength({ min: 3, max: 30 })
    .trim()
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-30 characters and contain only letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
  body('firstName')
    .optional()
    .isLength({ max: 100 })
    .trim()
    .withMessage('First name must be at most 100 characters'),
  body('lastName')
    .optional()
    .isLength({ max: 100 })
    .trim()
    .withMessage('Last name must be at most 100 characters'),
  body('phoneNumber')
    .optional()
    .isLength({ max: 20 })
    .trim()
    .withMessage('Phone number must be at most 20 characters'),
  body('tkid')
    .optional()
    .isLength({ max: 20 })
    .trim()
    .withMessage('TKID must be at most 20 characters'),
  body('organizationId')
    .notEmpty()
    .withMessage('Organization is required')
    .isInt({ min: 1 })
    .withMessage('Organization ID must be a positive integer'),
  body('clubId')
    .notEmpty()
    .withMessage('Club is required')
    .isInt({ min: 1 })
    .withMessage('Club ID must be a positive integer'),
];

const loginValidation = [
  body('emailOrUsername')
    .notEmpty()
    .trim()
    .withMessage('Email or username is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const forgotPasswordValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
];

const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);
router.get('/me', authenticate, AuthController.me);

// Password reset routes
router.post('/forgot-password', forgotPasswordValidation, PasswordResetController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, PasswordResetController.resetPassword);
router.get('/verify-reset-token/:token', PasswordResetController.verifyResetToken);

// Email verification routes
router.post('/send-verification', authenticate, EmailVerificationController.sendVerification);
router.post('/verify-email', EmailVerificationController.verifyEmail);
router.get('/verification-status', authenticate, EmailVerificationController.getVerificationStatus);

export default router;
