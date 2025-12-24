import { Router } from 'express';
import { SearchController } from '../controllers/search.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All search routes require authentication
router.use(authenticate);

// GET /api/search/troops?q=... - Search troops
router.get('/troops', SearchController.searchTroops);

// GET /api/search/users?q=... - Search users/members
router.get('/users', SearchController.searchUsers);

export default router;
