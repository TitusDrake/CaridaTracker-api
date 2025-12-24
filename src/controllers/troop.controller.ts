import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { TroopModel } from '../models/troop.model';
import { TroopCreateInput, TroopUpdateInput } from '../types';

export class TroopController {
  /**
   * GET /api/troops - List all troops visible to the authenticated user
   */
  static async getAll(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const troops = await TroopModel.findAllForUser(req.user.userId);
      res.json(troops);
    } catch (error) {
      console.error('Error fetching troops:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/troops/:id - Get a single troop by ID
   */
  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid troop ID' });
        return;
      }

      const troop = await TroopModel.findByIdWithDetails(id, req.user?.userId);

      if (!troop) {
        res.status(404).json({ error: 'Troop not found' });
        return;
      }

      // Check if user can view this troop
      if (req.user) {
        const canView = await TroopModel.canUserView(id, req.user.userId);
        if (!canView) {
          res.status(403).json({ error: 'You do not have access to this troop' });
          return;
        }
      }

      res.json(troop);
    } catch (error) {
      console.error('Error fetching troop:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/troops - Create a new troop (admin only)
   */
  static async create(req: Request, res: Response): Promise<void> {
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

      // Get the club_id from the request body (which club is creating this troop)
      const clubId = parseInt(req.body.created_by_club_id, 10);
      if (isNaN(clubId)) {
        res.status(400).json({ error: 'created_by_club_id is required' });
        return;
      }

      // Check if user is admin for this club
      const isAdmin = await TroopModel.isUserAdmin(req.user.userId, clubId);
      if (!isAdmin) {
        res.status(403).json({ error: 'Only club admins can create troops' });
        return;
      }

      const data: TroopCreateInput = {
        event_name: req.body.event_name,
        event_date: req.body.event_date,
        venue_name: req.body.venue_name,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zip_code: req.body.zip_code,
        start_time: req.body.start_time,
        arrival_time: req.body.arrival_time,
        end_time: req.body.end_time,
        prop_weapons_allowed: req.body.prop_weapons_allowed,
        share_with_sister_groups: req.body.share_with_sister_groups,
        requested_characters_count: req.body.requested_characters_count,
        secure_changing_area: req.body.secure_changing_area,
        changing_area_description: req.body.changing_area_description,
        amenities: req.body.amenities,
        description: req.body.description,
        signup_link: req.body.signup_link,
        policies_link: req.body.policies_link,
        club_ids: req.body.club_ids,
      };

      const troop = await TroopModel.create(data, req.user.userId, clubId);
      const troopWithDetails = await TroopModel.findByIdWithDetails(troop.id, req.user.userId);

      res.status(201).json(troopWithDetails);
    } catch (error) {
      console.error('Error creating troop:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * PUT /api/troops/:id - Update a troop (admin only)
   */
  static async update(req: Request, res: Response): Promise<void> {
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

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid troop ID' });
        return;
      }

      // Check if troop exists
      const existingTroop = await TroopModel.findById(id);
      if (!existingTroop) {
        res.status(404).json({ error: 'Troop not found' });
        return;
      }

      // Check if user can modify this troop
      const canModify = await TroopModel.canUserModify(id, req.user.userId);
      if (!canModify) {
        res.status(403).json({ error: 'Only admins of the creating club can update this troop' });
        return;
      }

      const data: TroopUpdateInput = {
        event_name: req.body.event_name,
        event_date: req.body.event_date,
        venue_name: req.body.venue_name,
        address: req.body.address,
        city: req.body.city,
        state: req.body.state,
        zip_code: req.body.zip_code,
        start_time: req.body.start_time,
        arrival_time: req.body.arrival_time,
        end_time: req.body.end_time,
        prop_weapons_allowed: req.body.prop_weapons_allowed,
        share_with_sister_groups: req.body.share_with_sister_groups,
        requested_characters_count: req.body.requested_characters_count,
        secure_changing_area: req.body.secure_changing_area,
        changing_area_description: req.body.changing_area_description,
        amenities: req.body.amenities,
        description: req.body.description,
        signup_link: req.body.signup_link,
        policies_link: req.body.policies_link,
        club_ids: req.body.club_ids,
      };

      // Remove undefined values
      Object.keys(data).forEach(key => {
        if ((data as any)[key] === undefined) {
          delete (data as any)[key];
        }
      });

      await TroopModel.update(id, data);
      const troopWithDetails = await TroopModel.findByIdWithDetails(id, req.user.userId);

      res.json(troopWithDetails);
    } catch (error) {
      console.error('Error updating troop:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * DELETE /api/troops/:id - Delete a troop (admin only)
   */
  static async delete(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'Invalid troop ID' });
        return;
      }

      // Check if troop exists
      const existingTroop = await TroopModel.findById(id);
      if (!existingTroop) {
        res.status(404).json({ error: 'Troop not found' });
        return;
      }

      // Check if user can modify this troop
      const canModify = await TroopModel.canUserModify(id, req.user.userId);
      if (!canModify) {
        res.status(403).json({ error: 'Only admins of the creating club can delete this troop' });
        return;
      }

      await TroopModel.delete(id);
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting troop:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
