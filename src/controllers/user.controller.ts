import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { UserModel } from '../models/user.model';
import { ClubModel } from '../models/club.model';

export class UserController {
  /**
   * GET /api/users/me/clubs - Get current user's club memberships
   */
  static async getMyClubs(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const clubs = await UserModel.getClubMemberships(req.user.userId);

      res.json(clubs);
    } catch (error) {
      console.error('Error getting user clubs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/users/me/stats - Get current user's global stats
   */
  static async getMyStats(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const stats = await UserModel.getGlobalStats(req.user.userId);

      res.json({
        total_troops: parseInt(stats.total_troops) || 0,
        clubs_attended_as: parseInt(stats.clubs_attended_as) || 0,
        upcoming_troops: parseInt(stats.upcoming_troops) || 0,
        past_troops: parseInt(stats.past_troops) || 0,
        next_troop_date: stats.next_troop_date || null,
      });
    } catch (error) {
      console.error('Error getting user stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/users/me/clubs/:clubId/stats - Get current user's stats for a specific club
   */
  static async getClubStats(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const clubId = parseInt(req.params.clubId, 10);
      if (isNaN(clubId)) {
        res.status(400).json({ error: 'Invalid club ID' });
        return;
      }

      // Check if user is a member of this club
      const isMember = await ClubModel.isUserMember(clubId, req.user.userId);
      if (!isMember) {
        res.status(403).json({ error: 'You are not a member of this club' });
        return;
      }

      const stats = await UserModel.getClubStats(req.user.userId, clubId);

      res.json({
        total_troops: parseInt(stats.total_troops) || 0,
        upcoming_troops: parseInt(stats.upcoming_troops) || 0,
        past_troops: parseInt(stats.past_troops) || 0,
        next_troop_date: stats.next_troop_date || null,
        last_troop_date: stats.last_troop_date || null,
        club: stats.club,
      });
    } catch (error) {
      console.error('Error getting club stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/users/search - Search for users
   */
  static async search(req: Request, res: Response): Promise<void> {
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
