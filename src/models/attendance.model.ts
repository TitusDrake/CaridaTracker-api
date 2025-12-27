import { query } from '../config/database';
import { TroopAttendee, AttendeeType, SignupStatus } from '../types';

export interface AttendeeWithDetails extends TroopAttendee {
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  club_name: string;
  shift_name?: string | null;
}

export interface AttendInput {
  troop_id: number;
  user_id: number;
  club_id: number;
  status?: string;
  notes?: string;
  costume_id?: number;
  costume_name?: string;
  backup_costume_id?: number;
  backup_costume_name?: string;
  attendance_status?: 'confirmed' | 'tentative';
  shift_id?: number;
  attendee_type?: AttendeeType;
}

export interface CapacityInfo {
  max_troopers: number | null;
  max_squires: number | null;
  current_troopers: number;
  current_squires: number;
  admin_approval_required: boolean;
  waitlist_enabled: boolean;
}

export class AttendanceModel {
  /**
   * Get capacity info for a troop/shift
   */
  static async getCapacityInfo(troopId: number, shiftId?: number): Promise<CapacityInfo> {
    // Get troop settings
    const troopResult = await query(
      `SELECT max_troopers, max_squires, admin_approval_required, waitlist_enabled
       FROM troops WHERE id = $1`,
      [troopId],
    );

    if (troopResult.rows.length === 0) {
      throw new Error('Troop not found');
    }

    let maxTroopers = troopResult.rows[0].max_troopers;
    let maxSquires = troopResult.rows[0].max_squires;
    const adminApprovalRequired = troopResult.rows[0].admin_approval_required;
    const waitlistEnabled = troopResult.rows[0].waitlist_enabled;

    // If shift specified, check for shift-level overrides
    if (shiftId) {
      const shiftResult = await query(
        'SELECT max_troopers, max_squires FROM troop_shifts WHERE id = $1 AND troop_id = $2',
        [shiftId, troopId],
      );
      if (shiftResult.rows.length > 0) {
        if (shiftResult.rows[0].max_troopers !== null) {
          maxTroopers = shiftResult.rows[0].max_troopers;
        }
        if (shiftResult.rows[0].max_squires !== null) {
          maxSquires = shiftResult.rows[0].max_squires;
        }
      }
    }

    // Get current counts (only confirmed attendees count against capacity)
    const whereClause = shiftId
      ? 'troop_id = $1 AND shift_id = $2 AND signup_status = $3'
      : 'troop_id = $1 AND shift_id IS NULL AND signup_status = $2';

    const countParams = shiftId
      ? [troopId, shiftId, 'confirmed']
      : [troopId, 'confirmed'];

    const countResult = await query(
      `SELECT
        COUNT(*) FILTER (WHERE attendee_type = 'trooper') as trooper_count,
        COUNT(*) FILTER (WHERE attendee_type = 'squire') as squire_count
       FROM troop_attendees
       WHERE ${whereClause}`,
      countParams,
    );

    return {
      max_troopers: maxTroopers,
      max_squires: maxSquires,
      current_troopers: parseInt(countResult.rows[0].trooper_count, 10),
      current_squires: parseInt(countResult.rows[0].squire_count, 10),
      admin_approval_required: adminApprovalRequired,
      waitlist_enabled: waitlistEnabled,
    };
  }

  /**
   * Get next waitlist position for a troop/shift/type
   */
  static async getNextWaitlistPosition(
    troopId: number,
    attendeeType: AttendeeType,
    shiftId?: number,
  ): Promise<number> {
    const whereClause = shiftId
      ? 'troop_id = $1 AND attendee_type = $2 AND shift_id = $3 AND waitlist_position IS NOT NULL'
      : 'troop_id = $1 AND attendee_type = $2 AND shift_id IS NULL AND waitlist_position IS NOT NULL';

    const params = shiftId ? [troopId, attendeeType, shiftId] : [troopId, attendeeType];

    const result = await query(
      `SELECT COALESCE(MAX(waitlist_position), 0) + 1 as next_position
       FROM troop_attendees
       WHERE ${whereClause}`,
      params,
    );

    return parseInt(result.rows[0].next_position, 10);
  }

  /**
   * Sign up user for a troop under a specific club
   * Handles capacity limits, waitlist, and admin approval
   */
  static async signUp(input: AttendInput): Promise<TroopAttendee> {
    const {
      troop_id,
      user_id,
      club_id,
      status = 'signed_up',
      notes,
      costume_id,
      costume_name,
      backup_costume_id,
      backup_costume_name,
      attendance_status = 'confirmed',
      shift_id,
      attendee_type = 'trooper',
    } = input;

    // Get capacity info
    const capacity = await this.getCapacityInfo(troop_id, shift_id);

    // Determine signup_status based on capacity and settings
    let signupStatus: SignupStatus = 'confirmed';
    let waitlistPosition: number | null = null;

    // Check if admin approval is required
    if (capacity.admin_approval_required) {
      signupStatus = 'pending_approval';
    } else {
      // Check capacity limits
      const currentCount = attendee_type === 'trooper' ? capacity.current_troopers : capacity.current_squires;
      const maxCount = attendee_type === 'trooper' ? capacity.max_troopers : capacity.max_squires;

      if (maxCount !== null && currentCount >= maxCount) {
        // Capacity reached
        if (capacity.waitlist_enabled) {
          signupStatus = 'waitlisted';
          waitlistPosition = await this.getNextWaitlistPosition(troop_id, attendee_type, shift_id);
        } else {
          throw new Error(`No spots available for ${attendee_type}s`);
        }
      }
    }

    const result = await query(
      `INSERT INTO troop_attendees (
        troop_id, user_id, club_id, status, notes,
        costume_id, costume_name,
        backup_costume_id, backup_costume_name,
        attendance_status, shift_id,
        attendee_type, signup_status, waitlist_position
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        troop_id,
        user_id,
        club_id,
        status,
        notes || null,
        costume_id || null,
        costume_name || null,
        backup_costume_id || null,
        backup_costume_name || null,
        attendance_status,
        shift_id || null,
        attendee_type,
        signupStatus,
        waitlistPosition,
      ],
    );

    return result.rows[0];
  }

  /**
   * Cancel attendance for a specific troop/user/club combination
   * Also promotes waitlisted users if applicable
   */
  static async cancel(troopId: number, userId: number, clubId: number): Promise<boolean> {
    // Get the attendance record first to check status and type
    const attendeeResult = await query(
      `SELECT id, attendee_type, signup_status, shift_id
       FROM troop_attendees
       WHERE troop_id = $1 AND user_id = $2 AND club_id = $3`,
      [troopId, userId, clubId],
    );

    if (attendeeResult.rows.length === 0) {
      return false;
    }

    const attendee = attendeeResult.rows[0];
    const wasConfirmed = attendee.signup_status === 'confirmed';
    const attendeeType = attendee.attendee_type;
    const shiftId = attendee.shift_id;

    // Delete the attendance
    const result = await query(
      `DELETE FROM troop_attendees
       WHERE troop_id = $1 AND user_id = $2 AND club_id = $3
       RETURNING id`,
      [troopId, userId, clubId],
    );

    // If they were confirmed, promote the next person from waitlist
    if (wasConfirmed) {
      await this.promoteFromWaitlist(troopId, attendeeType, shiftId);
    }

    // Reorder remaining waitlist positions
    await this.reorderWaitlist(troopId, attendeeType, shiftId);

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Promote the next person from the waitlist
   */
  static async promoteFromWaitlist(
    troopId: number,
    attendeeType: AttendeeType,
    shiftId?: number | null,
  ): Promise<TroopAttendee | null> {
    const whereClause = shiftId
      ? 'troop_id = $1 AND attendee_type = $2 AND shift_id = $3 AND signup_status = $4'
      : 'troop_id = $1 AND attendee_type = $2 AND shift_id IS NULL AND signup_status = $3';

    const params = shiftId
      ? [troopId, attendeeType, shiftId, 'waitlisted']
      : [troopId, attendeeType, 'waitlisted'];

    // Find the person at position 1 in waitlist
    const nextResult = await query(
      `SELECT id FROM troop_attendees
       WHERE ${whereClause} AND waitlist_position = 1`,
      params,
    );

    if (nextResult.rows.length === 0) {
      return null;
    }

    // Promote them to confirmed
    const updateResult = await query(
      `UPDATE troop_attendees
       SET signup_status = 'confirmed', waitlist_position = NULL
       WHERE id = $1
       RETURNING *`,
      [nextResult.rows[0].id],
    );

    return updateResult.rows[0] || null;
  }

  /**
   * Reorder waitlist positions after someone leaves or is promoted
   */
  static async reorderWaitlist(
    troopId: number,
    attendeeType: AttendeeType,
    shiftId?: number | null,
  ): Promise<void> {
    const whereClause = shiftId
      ? 'troop_id = $1 AND attendee_type = $2 AND shift_id = $3 AND signup_status = $4'
      : 'troop_id = $1 AND attendee_type = $2 AND shift_id IS NULL AND signup_status = $3';

    const params = shiftId
      ? [troopId, attendeeType, shiftId, 'waitlisted']
      : [troopId, attendeeType, 'waitlisted'];

    // Renumber all waitlist positions
    await query(
      `WITH numbered AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY waitlist_position ASC, signed_up_at ASC) as new_pos
        FROM troop_attendees
        WHERE ${whereClause}
      )
      UPDATE troop_attendees ta
      SET waitlist_position = numbered.new_pos
      FROM numbered
      WHERE ta.id = numbered.id`,
      params,
    );
  }

  /**
   * Admin approves a pending signup
   */
  static async approveSignup(attendeeId: number, adminUserId: number): Promise<TroopAttendee | null> {
    const result = await query(
      `UPDATE troop_attendees
       SET signup_status = 'confirmed',
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND signup_status = 'pending_approval'
       RETURNING *`,
      [adminUserId, attendeeId],
    );

    return result.rows[0] || null;
  }

  /**
   * Admin rejects a pending signup
   */
  static async rejectSignup(attendeeId: number, adminUserId: number): Promise<TroopAttendee | null> {
    const result = await query(
      `UPDATE troop_attendees
       SET signup_status = 'rejected',
           approved_by = $1,
           approved_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND signup_status = 'pending_approval'
       RETURNING *`,
      [adminUserId, attendeeId],
    );

    return result.rows[0] || null;
  }

  /**
   * Check if user is already attending a troop under a specific club
   */
  static async isAttending(troopId: number, userId: number, clubId: number): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM troop_attendees
       WHERE troop_id = $1 AND user_id = $2 AND club_id = $3
       LIMIT 1`,
      [troopId, userId, clubId],
    );

    return result.rows.length > 0;
  }

  /**
   * Get all attendees for a troop with user details
   * Sorted by: attendee_type (troopers first), then signup_status, then waitlist_position
   */
  static async getAttendees(troopId: number): Promise<AttendeeWithDetails[]> {
    const result = await query(
      `SELECT
        ta.*,
        u.username,
        u.first_name,
        u.last_name,
        c.name as club_name,
        ts.name as shift_name
       FROM troop_attendees ta
       INNER JOIN users u ON ta.user_id = u.id
       INNER JOIN clubs c ON ta.club_id = c.id
       LEFT JOIN troop_shifts ts ON ta.shift_id = ts.id
       WHERE ta.troop_id = $1
       ORDER BY
         ta.attendee_type ASC,
         CASE ta.signup_status
           WHEN 'confirmed' THEN 1
           WHEN 'pending_approval' THEN 2
           WHEN 'waitlisted' THEN 3
           WHEN 'rejected' THEN 4
         END ASC,
         ta.waitlist_position ASC NULLS LAST,
         ta.signed_up_at ASC`,
      [troopId],
    );

    return result.rows;
  }

  /**
   * Get attendees for a specific shift
   */
  static async getAttendeesByShift(troopId: number, shiftId: number): Promise<AttendeeWithDetails[]> {
    const result = await query(
      `SELECT
        ta.*,
        u.username,
        u.first_name,
        u.last_name,
        c.name as club_name,
        ts.name as shift_name
       FROM troop_attendees ta
       INNER JOIN users u ON ta.user_id = u.id
       INNER JOIN clubs c ON ta.club_id = c.id
       LEFT JOIN troop_shifts ts ON ta.shift_id = ts.id
       WHERE ta.troop_id = $1 AND ta.shift_id = $2
       ORDER BY
         ta.attendee_type ASC,
         CASE ta.signup_status
           WHEN 'confirmed' THEN 1
           WHEN 'pending_approval' THEN 2
           WHEN 'waitlisted' THEN 3
           WHEN 'rejected' THEN 4
         END ASC,
         ta.waitlist_position ASC NULLS LAST,
         ta.signed_up_at ASC`,
      [troopId, shiftId],
    );

    return result.rows;
  }

  /**
   * Get pending approvals for a troop
   */
  static async getPendingApprovals(troopId: number): Promise<AttendeeWithDetails[]> {
    const result = await query(
      `SELECT
        ta.*,
        u.username,
        u.first_name,
        u.last_name,
        c.name as club_name,
        ts.name as shift_name
       FROM troop_attendees ta
       INNER JOIN users u ON ta.user_id = u.id
       INNER JOIN clubs c ON ta.club_id = c.id
       LEFT JOIN troop_shifts ts ON ta.shift_id = ts.id
       WHERE ta.troop_id = $1 AND ta.signup_status = 'pending_approval'
       ORDER BY ta.signed_up_at ASC`,
      [troopId],
    );

    return result.rows;
  }

  /**
   * Get user's attendance record for a specific troop (all clubs)
   */
  static async getUserAttendance(troopId: number, userId: number): Promise<TroopAttendee[]> {
    const result = await query(
      `SELECT * FROM troop_attendees
       WHERE troop_id = $1 AND user_id = $2`,
      [troopId, userId],
    );

    return result.rows;
  }

  /**
   * Check if user is a member of the specified club
   */
  static async isClubMember(userId: number, clubId: number): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM club_members
       WHERE user_id = $1 AND club_id = $2
       LIMIT 1`,
      [userId, clubId],
    );

    return result.rows.length > 0;
  }

  /**
   * Check if troop is visible to the specified club
   */
  static async isTroopVisibleToClub(troopId: number, clubId: number): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM troop_clubs
       WHERE troop_id = $1 AND club_id = $2 AND enabled = true
       LIMIT 1`,
      [troopId, clubId],
    );

    return result.rows.length > 0;
  }

  /**
   * Get count of attendees for a troop by type and status
   */
  static async getAttendeeCounts(
    troopId: number,
    shiftId?: number,
  ): Promise<{ troopers: number; squires: number; waitlisted_troopers: number; waitlisted_squires: number; pending: number }> {
    const whereClause = shiftId
      ? 'troop_id = $1 AND shift_id = $2'
      : 'troop_id = $1';
    const params = shiftId ? [troopId, shiftId] : [troopId];

    const result = await query(
      `SELECT
        COUNT(*) FILTER (WHERE attendee_type = 'trooper' AND signup_status = 'confirmed') as troopers,
        COUNT(*) FILTER (WHERE attendee_type = 'squire' AND signup_status = 'confirmed') as squires,
        COUNT(*) FILTER (WHERE attendee_type = 'trooper' AND signup_status = 'waitlisted') as waitlisted_troopers,
        COUNT(*) FILTER (WHERE attendee_type = 'squire' AND signup_status = 'waitlisted') as waitlisted_squires,
        COUNT(*) FILTER (WHERE signup_status = 'pending_approval') as pending
       FROM troop_attendees
       WHERE ${whereClause}`,
      params,
    );

    return {
      troopers: parseInt(result.rows[0].troopers, 10),
      squires: parseInt(result.rows[0].squires, 10),
      waitlisted_troopers: parseInt(result.rows[0].waitlisted_troopers, 10),
      waitlisted_squires: parseInt(result.rows[0].waitlisted_squires, 10),
      pending: parseInt(result.rows[0].pending, 10),
    };
  }

  /**
   * Get count of attendees for a troop (legacy - for backwards compatibility)
   */
  static async getAttendeeCount(troopId: number): Promise<number> {
    const result = await query(
      "SELECT COUNT(*) as count FROM troop_attendees WHERE troop_id = $1 AND signup_status = 'confirmed'",
      [troopId],
    );

    return parseInt(result.rows[0].count, 10);
  }
}
