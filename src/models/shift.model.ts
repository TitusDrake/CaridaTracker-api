import { query } from '../config/database';
import { TroopShift, TroopShiftInput } from '../types';

export interface ShiftWithAttendeeCount extends TroopShift {
  attendee_count: number;
}

export class ShiftModel {
  /**
   * Create a new shift for a troop
   */
  static async create(troopId: number, input: TroopShiftInput): Promise<TroopShift> {
    const { name, start_time, end_time, max_attendees } = input;

    const result = await query(
      `INSERT INTO troop_shifts (troop_id, name, start_time, end_time, max_attendees)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [troopId, name, start_time || null, end_time || null, max_attendees || null],
    );

    return result.rows[0];
  }

  /**
   * Get all shifts for a troop with attendee counts
   */
  static async getByTroopId(troopId: number): Promise<ShiftWithAttendeeCount[]> {
    const result = await query(
      `SELECT
        ts.*,
        COUNT(ta.id)::integer as attendee_count
       FROM troop_shifts ts
       LEFT JOIN troop_attendees ta ON ta.shift_id = ts.id
       WHERE ts.troop_id = $1
       GROUP BY ts.id
       ORDER BY ts.start_time ASC NULLS LAST, ts.name ASC`,
      [troopId],
    );

    return result.rows;
  }

  /**
   * Get a single shift by ID
   */
  static async findById(id: number): Promise<TroopShift | null> {
    const result = await query('SELECT * FROM troop_shifts WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  /**
   * Update a shift
   */
  static async update(id: number, input: Partial<TroopShiftInput>): Promise<TroopShift | null> {
    const { name, start_time, end_time, max_attendees } = input;

    const result = await query(
      `UPDATE troop_shifts
       SET name = COALESCE($1, name),
           start_time = COALESCE($2, start_time),
           end_time = COALESCE($3, end_time),
           max_attendees = COALESCE($4, max_attendees)
       WHERE id = $5
       RETURNING *`,
      [name, start_time, end_time, max_attendees, id],
    );

    return result.rows[0] || null;
  }

  /**
   * Delete a shift
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query('DELETE FROM troop_shifts WHERE id = $1 RETURNING id', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Delete all shifts for a troop
   */
  static async deleteByTroopId(troopId: number): Promise<number> {
    const result = await query('DELETE FROM troop_shifts WHERE troop_id = $1', [troopId]);
    return result.rowCount || 0;
  }

  /**
   * Check if a shift belongs to a specific troop
   */
  static async belongsToTroop(shiftId: number, troopId: number): Promise<boolean> {
    const result = await query(
      'SELECT 1 FROM troop_shifts WHERE id = $1 AND troop_id = $2 LIMIT 1',
      [shiftId, troopId],
    );
    return result.rows.length > 0;
  }

  /**
   * Check if shift has room for more attendees
   */
  static async hasCapacity(shiftId: number): Promise<boolean> {
    const result = await query(
      `SELECT
        ts.max_attendees,
        COUNT(ta.id)::integer as current_count
       FROM troop_shifts ts
       LEFT JOIN troop_attendees ta ON ta.shift_id = ts.id
       WHERE ts.id = $1
       GROUP BY ts.id`,
      [shiftId],
    );

    if (result.rows.length === 0) {
      return false;
    }

    const { max_attendees, current_count } = result.rows[0];
    // If no max set, unlimited capacity
    if (max_attendees === null) {
      return true;
    }
    return current_count < max_attendees;
  }
}
