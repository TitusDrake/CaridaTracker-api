import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ShiftModel } from '../models/shift.model';
import { TroopModel } from '../models/troop.model';

export class ShiftController {
  /**
   * GET /api/troops/:id/shifts - Get all shifts for a troop
   */
  static async getShifts(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const troopId = parseInt(req.params.id, 10);
      if (isNaN(troopId)) {
        res.status(400).json({ error: 'Invalid troop ID' });
        return;
      }

      // Check if troop exists
      const troop = await TroopModel.findById(troopId);
      if (!troop) {
        res.status(404).json({ error: 'Troop not found' });
        return;
      }

      // Check if user can view this troop
      const canView = await TroopModel.canUserView(troopId, req.user.userId);
      if (!canView) {
        res.status(403).json({ error: 'You do not have access to this troop' });
        return;
      }

      const shifts = await ShiftModel.getByTroopId(troopId);
      res.json(shifts);
    } catch (error) {
      console.error('Error getting shifts:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/troops/:id/shifts - Create a new shift (admin only)
   */
  static async createShift(req: Request, res: Response): Promise<void> {
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

      const troopId = parseInt(req.params.id, 10);
      if (isNaN(troopId)) {
        res.status(400).json({ error: 'Invalid troop ID' });
        return;
      }

      // Check if troop exists
      const troop = await TroopModel.findById(troopId);
      if (!troop) {
        res.status(404).json({ error: 'Troop not found' });
        return;
      }

      // Check if user is admin for this troop (creator or club admin)
      const isAdmin = await TroopModel.isTroopAdmin(troopId, req.user.userId);
      if (!isAdmin) {
        res.status(403).json({ error: 'Only troop administrators can create shifts' });
        return;
      }

      const shift = await ShiftModel.create(troopId, {
        name: req.body.name,
        start_time: req.body.start_time,
        end_time: req.body.end_time,
        max_attendees: req.body.max_attendees,
      });

      res.status(201).json(shift);
    } catch (error) {
      console.error('Error creating shift:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * PUT /api/troops/:id/shifts/:shiftId - Update a shift (admin only)
   */
  static async updateShift(req: Request, res: Response): Promise<void> {
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

      const troopId = parseInt(req.params.id, 10);
      const shiftId = parseInt(req.params.shiftId, 10);

      if (isNaN(troopId) || isNaN(shiftId)) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
      }

      // Check if troop exists
      const troop = await TroopModel.findById(troopId);
      if (!troop) {
        res.status(404).json({ error: 'Troop not found' });
        return;
      }

      // Check if shift belongs to troop
      const belongsToTroop = await ShiftModel.belongsToTroop(shiftId, troopId);
      if (!belongsToTroop) {
        res.status(404).json({ error: 'Shift not found' });
        return;
      }

      // Check if user is admin for this troop
      const isAdmin = await TroopModel.isTroopAdmin(troopId, req.user.userId);
      if (!isAdmin) {
        res.status(403).json({ error: 'Only troop administrators can update shifts' });
        return;
      }

      const shift = await ShiftModel.update(shiftId, {
        name: req.body.name,
        start_time: req.body.start_time,
        end_time: req.body.end_time,
        max_attendees: req.body.max_attendees,
      });

      res.json(shift);
    } catch (error) {
      console.error('Error updating shift:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * DELETE /api/troops/:id/shifts/:shiftId - Delete a shift (admin only)
   */
  static async deleteShift(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const troopId = parseInt(req.params.id, 10);
      const shiftId = parseInt(req.params.shiftId, 10);

      if (isNaN(troopId) || isNaN(shiftId)) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
      }

      // Check if troop exists
      const troop = await TroopModel.findById(troopId);
      if (!troop) {
        res.status(404).json({ error: 'Troop not found' });
        return;
      }

      // Check if shift belongs to troop
      const belongsToTroop = await ShiftModel.belongsToTroop(shiftId, troopId);
      if (!belongsToTroop) {
        res.status(404).json({ error: 'Shift not found' });
        return;
      }

      // Check if user is admin for this troop
      const isAdmin = await TroopModel.isTroopAdmin(troopId, req.user.userId);
      if (!isAdmin) {
        res.status(403).json({ error: 'Only troop administrators can delete shifts' });
        return;
      }

      await ShiftModel.delete(shiftId);
      res.json({ message: 'Shift deleted successfully' });
    } catch (error) {
      console.error('Error deleting shift:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
