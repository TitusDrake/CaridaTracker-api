import { Router } from 'express';
import { body, param } from 'express-validator';
import { AttendanceController } from '../controllers/attendance.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware
const signUpValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid troop ID'),
  body('club_id')
    .notEmpty()
    .withMessage('Club ID is required')
    .isInt({ min: 1 })
    .withMessage('Club ID must be a positive integer'),
  body('notes')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Notes must be less than 500 characters'),
];

const cancelValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid troop ID'),
  body('club_id')
    .notEmpty()
    .withMessage('Club ID is required')
    .isInt({ min: 1 })
    .withMessage('Club ID must be a positive integer'),
];

const attendeesValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid troop ID'),
];

// All attendance routes require authentication
router.use(authenticate);

// POST /api/troops/:id/attend - Sign up for a troop
router.post('/:id/attend', signUpValidation, AttendanceController.signUp);

// DELETE /api/troops/:id/attend - Cancel attendance
router.delete('/:id/attend', cancelValidation, AttendanceController.cancel);

// GET /api/troops/:id/attendees - List attendees
router.get('/:id/attendees', attendeesValidation, AttendanceController.getAttendees);

export default router;
