import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AttendanceModel } from '../models/attendance.model';
import { TroopModel } from '../models/troop.model';

export class AttendanceController {
  /**
   * POST /api/troops/:id/attend - Sign up for a troop
   * Body: { club_id: number, notes?: string }
   */
  static async signUp(req: Request, res: Response): Promise<void> {
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

      const clubId = parseInt(req.body.club_id, 10);
      if (isNaN(clubId)) {
        res.status(400).json({ error: 'club_id is required' });
        return;
      }

      // Check if troop exists
      const troop = await TroopModel.findById(troopId);
      if (!troop) {
        res.status(404).json({ error: 'Troop not found' });
        return;
      }

      // Check if user is a member of the club
      const isMember = await AttendanceModel.isClubMember(req.user.userId, clubId);
      if (!isMember) {
        res.status(403).json({ error: 'You are not a member of this club' });
        return;
      }

      // Check if troop is visible to this club
      const isVisible = await AttendanceModel.isTroopVisibleToClub(troopId, clubId);
      if (!isVisible) {
        res.status(403).json({ error: 'This troop is not available for your club' });
        return;
      }

      // Check if already attending under this club
      const alreadyAttending = await AttendanceModel.isAttending(troopId, req.user.userId, clubId);
      if (alreadyAttending) {
        res.status(409).json({ error: 'You are already signed up for this troop under this club' });
        return;
      }

      // Sign up
      const attendance = await AttendanceModel.signUp({
        troop_id: troopId,
        user_id: req.user.userId,
        club_id: clubId,
        notes: req.body.notes,
      });

      res.status(201).json(attendance);
    } catch (error) {
      console.error('Error signing up for troop:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * DELETE /api/troops/:id/attend - Cancel attendance
   * Body: { club_id: number }
   */
  static async cancel(req: Request, res: Response): Promise<void> {
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

      const clubId = parseInt(req.body.club_id, 10);
      if (isNaN(clubId)) {
        res.status(400).json({ error: 'club_id is required' });
        return;
      }

      // Check if troop exists
      const troop = await TroopModel.findById(troopId);
      if (!troop) {
        res.status(404).json({ error: 'Troop not found' });
        return;
      }

      // Check if user is attending
      const isAttending = await AttendanceModel.isAttending(troopId, req.user.userId, clubId);
      if (!isAttending) {
        res.status(404).json({ error: 'You are not signed up for this troop under this club' });
        return;
      }

      // Cancel attendance
      await AttendanceModel.cancel(troopId, req.user.userId, clubId);

      res.status(200).json({ message: 'Attendance cancelled successfully' });
    } catch (error) {
      console.error('Error cancelling attendance:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/troops/:id/attendees - List all attendees (admin only)
   */
  static async getAttendees(req: Request, res: Response): Promise<void> {
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

      // Check if user can view this troop (is a member of a club that can see it)
      const canView = await TroopModel.canUserView(troopId, req.user.userId);
      if (!canView) {
        res.status(403).json({ error: 'You do not have access to this troop' });
        return;
      }

      // Get attendees
      const attendees = await AttendanceModel.getAttendees(troopId);

      res.json(attendees);
    } catch (error) {
      console.error('Error getting attendees:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
