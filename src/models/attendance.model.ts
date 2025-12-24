import { query } from '../config/database';
import { TroopAttendee } from '../types';

export interface AttendeeWithDetails extends TroopAttendee {
  username: string;
  first_name?: string | null;
  last_name?: string | null;
  club_name: string;
}

export interface AttendInput {
  troop_id: number;
  user_id: number;
  club_id: number;
  status?: string;
  notes?: string;
}

export class AttendanceModel {
  /**
   * Sign up user for a troop under a specific club
   */
  static async signUp(input: AttendInput): Promise<TroopAttendee> {
    const { troop_id, user_id, club_id, status = 'signed_up', notes } = input;

    const result = await query(
      `INSERT INTO troop_attendees (troop_id, user_id, club_id, status, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [troop_id, user_id, club_id, status, notes || null]
    );

    return result.rows[0];
  }

  /**
   * Cancel attendance for a specific troop/user/club combination
   */
  static async cancel(troopId: number, userId: number, clubId: number): Promise<boolean> {
    const result = await query(
      `DELETE FROM troop_attendees
       WHERE troop_id = $1 AND user_id = $2 AND club_id = $3
       RETURNING id`,
      [troopId, userId, clubId]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Check if user is already attending a troop under a specific club
   */
  static async isAttending(troopId: number, userId: number, clubId: number): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM troop_attendees
       WHERE troop_id = $1 AND user_id = $2 AND club_id = $3
       LIMIT 1`,
      [troopId, userId, clubId]
    );

    return result.rows.length > 0;
  }

  /**
   * Get all attendees for a troop with user details
   */
  static async getAttendees(troopId: number): Promise<AttendeeWithDetails[]> {
    const result = await query(
      `SELECT
        ta.*,
        u.username,
        u.first_name,
        u.last_name,
        c.name as club_name
       FROM troop_attendees ta
       INNER JOIN users u ON ta.user_id = u.id
       INNER JOIN clubs c ON ta.club_id = c.id
       WHERE ta.troop_id = $1
       ORDER BY ta.signed_up_at ASC`,
      [troopId]
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
      [troopId, userId]
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
      [userId, clubId]
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
      [troopId, clubId]
    );

    return result.rows.length > 0;
  }

  /**
   * Get count of attendees for a troop
   */
  static async getAttendeeCount(troopId: number): Promise<number> {
    const result = await query(
      `SELECT COUNT(*) as count FROM troop_attendees WHERE troop_id = $1`,
      [troopId]
    );

    return parseInt(result.rows[0].count, 10);
  }
}
