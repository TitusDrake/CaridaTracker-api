import { Router } from 'express';
import { body, param } from 'express-validator';
import { ShiftController } from '../controllers/shift.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Validation for shift creation/update
const shiftValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid troop ID'),
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Shift name is required')
    .isLength({ max: 100 })
    .withMessage('Shift name must be 100 characters or less'),
  body('start_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('Invalid start time format (HH:MM or HH:MM:SS)'),
  body('end_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('Invalid end time format (HH:MM or HH:MM:SS)'),
  body('max_attendees')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Max attendees must be a positive integer'),
];

const getShiftsValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid troop ID'),
];

const shiftIdValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid troop ID'),
  param('shiftId')
    .isInt({ min: 1 })
    .withMessage('Invalid shift ID'),
];

// All routes require authentication
router.use(authenticate);

// GET /api/troops/:id/shifts - Get all shifts for a troop
router.get('/:id/shifts', getShiftsValidation, ShiftController.getShifts);

// POST /api/troops/:id/shifts - Create a new shift (admin only)
router.post('/:id/shifts', shiftValidation, ShiftController.createShift);

// PUT /api/troops/:id/shifts/:shiftId - Update a shift (admin only)
router.put('/:id/shifts/:shiftId', [...shiftIdValidation, ...shiftValidation.slice(1)], ShiftController.updateShift);

// DELETE /api/troops/:id/shifts/:shiftId - Delete a shift (admin only)
router.delete('/:id/shifts/:shiftId', shiftIdValidation, ShiftController.deleteShift);

export default router;
