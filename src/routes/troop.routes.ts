import { Router } from 'express';
import { body, param } from 'express-validator';
import { TroopController } from '../controllers/troop.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware
const createTroopValidation = [
  body('event_name')
    .notEmpty()
    .withMessage('Event name is required')
    .isLength({ max: 255 })
    .withMessage('Event name must be less than 255 characters'),
  body('event_date')
    .notEmpty()
    .withMessage('Event date is required')
    .isISO8601()
    .withMessage('Event date must be a valid date'),
  body('created_by_club_id')
    .notEmpty()
    .withMessage('Club ID is required')
    .isInt({ min: 1 })
    .withMessage('Club ID must be a positive integer'),
  body('venue_name')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Venue name must be less than 255 characters'),
  body('address')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Address must be less than 255 characters'),
  body('city')
    .optional()
    .isLength({ max: 100 })
    .withMessage('City must be less than 100 characters'),
  body('state')
    .optional()
    .isLength({ max: 50 })
    .withMessage('State must be less than 50 characters'),
  body('zip_code')
    .optional()
    .isLength({ max: 20 })
    .withMessage('Zip code must be less than 20 characters'),
  body('start_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('Start time must be in HH:MM or HH:MM:SS format'),
  body('arrival_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('Arrival time must be in HH:MM or HH:MM:SS format'),
  body('end_time')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/)
    .withMessage('End time must be in HH:MM or HH:MM:SS format'),
  body('prop_weapons_allowed')
    .optional()
    .isBoolean()
    .withMessage('Prop weapons allowed must be a boolean'),
  body('share_with_sister_groups')
    .optional()
    .isBoolean()
    .withMessage('Share with sister groups must be a boolean'),
  body('secure_changing_area')
    .optional()
    .isBoolean()
    .withMessage('Secure changing area must be a boolean'),
  body('club_ids')
    .optional()
    .isArray()
    .withMessage('Club IDs must be an array'),
  body('club_ids.*')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Each club ID must be a positive integer'),
];

const updateTroopValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid troop ID'),
  body('event_name')
    .optional()
    .isLength({ max: 255 })
    .withMessage('Event name must be less than 255 characters'),
  body('event_date')
    .optional()
    .isISO8601()
    .withMessage('Event date must be a valid date'),
  // ... same optional validations as create
];

const idParamValidation = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Invalid troop ID'),
];

// Routes
// All troop routes require authentication
router.use(authenticate);

// GET /api/troops - List troops visible to user
router.get('/', TroopController.getAll);

// GET /api/troops/:id - Get single troop
router.get('/:id', idParamValidation, TroopController.getById);

// POST /api/troops - Create troop (admin only)
router.post('/', createTroopValidation, TroopController.create);

// PUT /api/troops/:id - Update troop (admin only)
router.put('/:id', updateTroopValidation, TroopController.update);

// DELETE /api/troops/:id - Delete troop (admin only)
router.delete('/:id', idParamValidation, TroopController.delete);

export default router;
