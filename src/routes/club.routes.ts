import { Router } from 'express';
import { ClubController } from '../controllers/club.controller';

const router = Router();

router.get('/', ClubController.getAll);
router.get('/organization/:organizationId', ClubController.getByOrganization);
router.get('/:id', ClubController.getById);

export default router;



