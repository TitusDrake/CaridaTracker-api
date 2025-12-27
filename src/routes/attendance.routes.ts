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

const approvalValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid troop ID'),
  param('attendeeId')
    .isInt({ min: 1 })
    .withMessage('Invalid attendee ID'),
];

// All attendance routes require authentication
router.use(authenticate);

// POST /api/troops/:id/attend - Sign up for a troop
router.post('/:id/attend', signUpValidation, AttendanceController.signUp);

// DELETE /api/troops/:id/attend - Cancel attendance
router.delete('/:id/attend', cancelValidation, AttendanceController.cancel);

// GET /api/troops/:id/attendees - List attendees
router.get('/:id/attendees', attendeesValidation, AttendanceController.getAttendees);

// GET /api/troops/:id/capacity - Get capacity info
router.get('/:id/capacity', attendeesValidation, AttendanceController.getCapacity);

// GET /api/troops/:id/pending-approvals - Get pending signups (admin only)
router.get('/:id/pending-approvals', attendeesValidation, AttendanceController.getPendingApprovals);

// POST /api/troops/:id/approve/:attendeeId - Approve a signup (admin only)
router.post('/:id/approve/:attendeeId', approvalValidation, AttendanceController.approveSignup);

// POST /api/troops/:id/reject/:attendeeId - Reject a signup (admin only)
router.post('/:id/reject/:attendeeId', approvalValidation, AttendanceController.rejectSignup);

export default router;
