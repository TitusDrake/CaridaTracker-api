import { Router } from 'express';
import { OrganizationController } from '../controllers/organization.controller';

const router = Router();

router.get('/', OrganizationController.getAll);
router.get('/:id', OrganizationController.getById);

export default router;



