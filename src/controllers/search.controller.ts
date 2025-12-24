import { Request, Response } from 'express';
import { TroopModel } from '../models/troop.model';
import { UserModel } from '../models/user.model';

export class SearchController {
  /**
   * GET /api/search/troops - Search troops
   */
  static async searchTroops(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const searchQuery = req.query.q as string;
      if (!searchQuery || searchQuery.trim().length < 2) {
        res.status(400).json({ error: 'Search query must be at least 2 characters' });
        return;
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const troops = await TroopModel.search(req.user.userId, searchQuery.trim(), limit);

      res.json(troops);
    } catch (error) {
      console.error('Error searching troops:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/search/users - Search users/members
   */
  static async searchUsers(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const searchQuery = req.query.q as string;
      if (!searchQuery || searchQuery.trim().length < 2) {
        res.status(400).json({ error: 'Search query must be at least 2 characters' });
        return;
      }

      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const users = await UserModel.search(searchQuery.trim(), limit);

      res.json(users);
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
