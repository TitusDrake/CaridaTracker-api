import { Router } from 'express';
import { param } from 'express-validator';
import { UserController } from '../controllers/user.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Validation middleware
const clubIdValidation = [
  param('clubId')
    .isInt({ min: 1 })
    .withMessage('Invalid club ID'),
];

// All user routes require authentication
router.use(authenticate);

// GET /api/users/me/clubs - Get current user's club memberships
router.get('/me/clubs', UserController.getMyClubs);

// GET /api/users/me/stats - Get current user's global stats
router.get('/me/stats', UserController.getMyStats);

// GET /api/users/me/clubs/:clubId/stats - Get stats for a specific club
router.get('/me/clubs/:clubId/stats', clubIdValidation, UserController.getClubStats);

// GET /api/users/search?q=... - Search users
router.get('/search', UserController.search);

export default router;
