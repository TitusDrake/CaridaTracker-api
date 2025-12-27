import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AttendanceModel } from '../models/attendance.model';
import { TroopModel } from '../models/troop.model';
import { AttendeeType } from '../types';

export class AttendanceController {
  /**
   * POST /api/troops/:id/attend - Sign up for a troop
   * Body: { club_id: number, notes?: string, attendee_type?: 'trooper' | 'squire', ... }
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

      // Parse costume fields
      const costumeId = req.body.costume_id ? parseInt(req.body.costume_id, 10) : undefined;
      const costumeName = req.body.costume_name || undefined;
      const backupCostumeId = req.body.backup_costume_id ? parseInt(req.body.backup_costume_id, 10) : undefined;
      const backupCostumeName = req.body.backup_costume_name || undefined;

      // Parse attendance status (default to 'confirmed')
      const attendanceStatus = req.body.attendance_status === 'tentative' ? 'tentative' : 'confirmed';

      // Parse shift_id if provided
      const shiftId = req.body.shift_id ? parseInt(req.body.shift_id, 10) : undefined;

      // Parse attendee_type (default to 'trooper')
      const attendeeType: AttendeeType = req.body.attendee_type === 'squire' ? 'squire' : 'trooper';

      const attendance = await AttendanceModel.signUp({
        troop_id: troopId,
        user_id: req.user.userId,
        club_id: clubId,
        notes: req.body.notes,
        costume_id: isNaN(costumeId as number) ? undefined : costumeId,
        costume_name: costumeName,
        backup_costume_id: isNaN(backupCostumeId as number) ? undefined : backupCostumeId,
        backup_costume_name: backupCostumeName,
        attendance_status: attendanceStatus,
        shift_id: isNaN(shiftId as number) ? undefined : shiftId,
        attendee_type: attendeeType,
      });

      // Return status info
      let message = 'You have signed up for this troop';
      if (attendance.signup_status === 'waitlisted') {
        message = `You have been added to the waitlist at position ${attendance.waitlist_position}`;
      } else if (attendance.signup_status === 'pending_approval') {
        message = 'Your signup is pending admin approval';
      }

      res.status(201).json({ ...attendance, message });
    } catch (error) {
      console.error('Error signing up for troop:', error);
      if (error instanceof Error && error.message.includes('No spots available')) {
        res.status(409).json({ error: error.message });
        return;
      }
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
   * GET /api/troops/:id/attendees - List all attendees
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

      // Get counts
      const counts = await AttendanceModel.getAttendeeCounts(troopId);

      res.json({
        attendees,
        counts,
      });
    } catch (error) {
      console.error('Error getting attendees:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/troops/:id/capacity - Get capacity info for a troop
   */
  static async getCapacity(req: Request, res: Response): Promise<void> {
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

      const shiftId = req.query.shift_id ? parseInt(req.query.shift_id as string, 10) : undefined;

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

      const capacity = await AttendanceModel.getCapacityInfo(troopId, shiftId);
      const counts = await AttendanceModel.getAttendeeCounts(troopId, shiftId);

      res.json({
        ...capacity,
        ...counts,
      });
    } catch (error) {
      console.error('Error getting capacity:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/troops/:id/pending-approvals - Get pending signups for admin approval
   */
  static async getPendingApprovals(req: Request, res: Response): Promise<void> {
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

      // Check if user is admin for this troop
      const isAdmin = await TroopModel.isTroopAdmin(troopId, req.user.userId);
      if (!isAdmin) {
        res.status(403).json({ error: 'Only troop administrators can view pending approvals' });
        return;
      }

      const pending = await AttendanceModel.getPendingApprovals(troopId);
      res.json(pending);
    } catch (error) {
      console.error('Error getting pending approvals:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/troops/:id/approve/:attendeeId - Approve a pending signup
   */
  static async approveSignup(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const troopId = parseInt(req.params.id, 10);
      const attendeeId = parseInt(req.params.attendeeId, 10);

      if (isNaN(troopId) || isNaN(attendeeId)) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
      }

      // Check if troop exists
      const troop = await TroopModel.findById(troopId);
      if (!troop) {
        res.status(404).json({ error: 'Troop not found' });
        return;
      }

      // Check if user is admin for this troop
      const isAdmin = await TroopModel.isTroopAdmin(troopId, req.user.userId);
      if (!isAdmin) {
        res.status(403).json({ error: 'Only troop administrators can approve signups' });
        return;
      }

      const approved = await AttendanceModel.approveSignup(attendeeId, req.user.userId);
      if (!approved) {
        res.status(404).json({ error: 'Pending signup not found' });
        return;
      }

      res.json({ message: 'Signup approved', attendance: approved });
    } catch (error) {
      console.error('Error approving signup:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/troops/:id/reject/:attendeeId - Reject a pending signup
   */
  static async rejectSignup(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const troopId = parseInt(req.params.id, 10);
      const attendeeId = parseInt(req.params.attendeeId, 10);

      if (isNaN(troopId) || isNaN(attendeeId)) {
        res.status(400).json({ error: 'Invalid ID' });
        return;
      }

      // Check if troop exists
      const troop = await TroopModel.findById(troopId);
      if (!troop) {
        res.status(404).json({ error: 'Troop not found' });
        return;
      }

      // Check if user is admin for this troop
      const isAdmin = await TroopModel.isTroopAdmin(troopId, req.user.userId);
      if (!isAdmin) {
        res.status(403).json({ error: 'Only troop administrators can reject signups' });
        return;
      }

      const rejected = await AttendanceModel.rejectSignup(attendeeId, req.user.userId);
      if (!rejected) {
        res.status(404).json({ error: 'Pending signup not found' });
        return;
      }

      res.json({ message: 'Signup rejected', attendance: rejected });
    } catch (error) {
      console.error('Error rejecting signup:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
