import { Router } from 'express';
import { CostumeController } from '../controllers/costume.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All costume routes require authentication
router.use(authenticate);

// GET /api/costumes/my-costumes - Get costumes for authenticated user
router.get('/my-costumes', CostumeController.getMyCostumes);

// GET /api/costumes/501st/:legionId - Get costumes by Legion ID
router.get('/501st/:legionId', CostumeController.get501stCostumes);

export default router;
