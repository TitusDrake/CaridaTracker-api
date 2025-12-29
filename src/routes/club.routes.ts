import { Router } from 'express';
import { ClubController } from '../controllers/club.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// Public routes (no auth required)
router.get('/', ClubController.getAll);
router.get('/organization/:organizationId', ClubController.getByOrganization);
router.get('/:id', ClubController.getById);

// Protected routes (auth required)
router.get('/:id/members', authenticate, ClubController.getMembers);

export default router;



