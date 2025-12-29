import { query } from '../config/database';
import { Troop, TroopCreateInput, TroopUpdateInput, TroopWithDetails, Club } from '../types';

export class TroopModel {
  /**
   * Find all troops visible to a user (based on their club memberships)
   */
  static async findAllForUser(userId: number): Promise<TroopWithDetails[]> {
    const result = await query(
      `SELECT DISTINCT
        t.*,
        u.username as creator_username,
        c.name as creator_club_name,
        (SELECT COUNT(*) FROM troop_attendees ta WHERE ta.troop_id = t.id) as attendee_count,
        EXISTS(SELECT 1 FROM troop_attendees ta WHERE ta.troop_id = t.id AND ta.user_id = $1) as is_attending
      FROM troops t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN clubs c ON t.created_by_club_id = c.id
      INNER JOIN troop_clubs tc ON t.id = tc.troop_id AND tc.enabled = true
      INNER JOIN club_members cm ON tc.club_id = cm.club_id AND cm.user_id = $1
      ORDER BY t.event_date DESC, t.start_time DESC`,
      [userId],
    );

    return result.rows;
  }

  /**
   * Find all troops (admin view - no filtering)
   */
  static async findAll(): Promise<TroopWithDetails[]> {
    const result = await query(
      `SELECT
        t.*,
        u.username as creator_username,
        c.name as creator_club_name,
        (SELECT COUNT(*) FROM troop_attendees ta WHERE ta.troop_id = t.id) as attendee_count
      FROM troops t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN clubs c ON t.created_by_club_id = c.id
      ORDER BY t.event_date DESC, t.start_time DESC`,
      [],
    );

    return result.rows;
  }

  /**
   * Find a troop by ID
   */
  static async findById(id: number): Promise<Troop | null> {
    const result = await query(
      'SELECT * FROM troops WHERE id = $1',
      [id],
    );

    return result.rows[0] || null;
  }

  /**
   * Find a troop by ID with full details
   */
  static async findByIdWithDetails(id: number, userId?: number): Promise<TroopWithDetails | null> {
    const result = await query(
      `SELECT
        t.*,
        u.username as creator_username,
        c.name as creator_club_name,
        (SELECT COUNT(*) FROM troop_attendees ta WHERE ta.troop_id = t.id) as attendee_count,
        ${userId ? 'EXISTS(SELECT 1 FROM troop_attendees ta WHERE ta.troop_id = t.id AND ta.user_id = $2) as is_attending' : 'false as is_attending'}
      FROM troops t
      LEFT JOIN users u ON t.created_by = u.id
      LEFT JOIN clubs c ON t.created_by_club_id = c.id
      WHERE t.id = $1`,
      userId ? [id, userId] : [id],
    );

    if (!result.rows[0]) {
      return null;
    }

    // Get clubs that can see this troop
    const clubsResult = await query(
      `SELECT c.* FROM clubs c
       INNER JOIN troop_clubs tc ON c.id = tc.club_id
       WHERE tc.troop_id = $1 AND tc.enabled = true`,
      [id],
    );

    return {
      ...result.rows[0],
      clubs: clubsResult.rows as Club[],
    };
  }

  /**
   * Check if a user can view a troop (is member of a club that has access)
   */
  static async canUserView(troopId: number, userId: number): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM troop_clubs tc
       INNER JOIN club_members cm ON tc.club_id = cm.club_id
       WHERE tc.troop_id = $1 AND cm.user_id = $2 AND tc.enabled = true
       LIMIT 1`,
      [troopId, userId],
    );

    return result.rows.length > 0;
  }

  /**
   * Check if a user is an admin for any club
   */
  static async isUserAdmin(userId: number, clubId?: number): Promise<boolean> {
    const sql = clubId
      ? 'SELECT 1 FROM club_members WHERE user_id = $1 AND club_id = $2 AND role IN (\'admin\', \'super_admin\') LIMIT 1'
      : 'SELECT 1 FROM club_members WHERE user_id = $1 AND role IN (\'admin\', \'super_admin\') LIMIT 1';

    const result = await query(sql, clubId ? [userId, clubId] : [userId]);
    return result.rows.length > 0;
  }

  /**
   * Get user's admin clubs
   */
  static async getUserAdminClubs(userId: number): Promise<number[]> {
    const result = await query(
      'SELECT club_id FROM club_members WHERE user_id = $1 AND role IN (\'admin\', \'super_admin\')',
      [userId],
    );
    return result.rows.map(row => row.club_id);
  }

  /**
   * Create a new troop
   */
  static async create(
    data: TroopCreateInput,
    createdBy: number,
    createdByClubId: number,
  ): Promise<Troop> {
    const result = await query(
      `INSERT INTO troops (
        event_name, event_date, venue_name, address, city, state, zip_code,
        start_time, arrival_time, end_time, prop_weapons_allowed,
        share_with_sister_groups, requested_characters_count, secure_changing_area,
        changing_area_description, amenities, description, signup_link, policies_link,
        max_troopers, max_squires, admin_approval_required, waitlist_enabled,
        created_by, created_by_club_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *`,
      [
        data.event_name,
        data.event_date,
        data.venue_name || null,
        data.address || null,
        data.city || null,
        data.state || null,
        data.zip_code || null,
        data.start_time || null,
        data.arrival_time || null,
        data.end_time || null,
        data.prop_weapons_allowed ?? false,
        data.share_with_sister_groups ?? false,
        data.requested_characters_count || null,
        data.secure_changing_area ?? false,
        data.changing_area_description || null,
        data.amenities || null,
        data.description || null,
        data.signup_link || null,
        data.policies_link || null,
        data.max_troopers ?? null,
        data.max_squires ?? null,
        data.admin_approval_required ?? false,
        data.waitlist_enabled ?? true,
        createdBy,
        createdByClubId,
      ],
    );

    const troop = result.rows[0];

    // Add club visibility entries
    if (data.club_ids && data.club_ids.length > 0) {
      for (const clubId of data.club_ids) {
        await query(
          'INSERT INTO troop_clubs (troop_id, club_id, enabled) VALUES ($1, $2, true) ON CONFLICT DO NOTHING',
          [troop.id, clubId],
        );
      }
    } else {
      // Default: make visible to the creator's club
      await query(
        'INSERT INTO troop_clubs (troop_id, club_id, enabled) VALUES ($1, $2, true)',
        [troop.id, createdByClubId],
      );
    }

    return troop;
  }

  /**
   * Update a troop
   */
  static async update(id: number, data: TroopUpdateInput): Promise<Troop | null> {
    // Build dynamic update query
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const fieldMap: Record<string, string> = {
      event_name: 'event_name',
      event_date: 'event_date',
      venue_name: 'venue_name',
      address: 'address',
      city: 'city',
      state: 'state',
      zip_code: 'zip_code',
      start_time: 'start_time',
      arrival_time: 'arrival_time',
      end_time: 'end_time',
      prop_weapons_allowed: 'prop_weapons_allowed',
      share_with_sister_groups: 'share_with_sister_groups',
      requested_characters_count: 'requested_characters_count',
      secure_changing_area: 'secure_changing_area',
      changing_area_description: 'changing_area_description',
      amenities: 'amenities',
      description: 'description',
      signup_link: 'signup_link',
      policies_link: 'policies_link',
      max_troopers: 'max_troopers',
      max_squires: 'max_squires',
      admin_approval_required: 'admin_approval_required',
      waitlist_enabled: 'waitlist_enabled',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (key in data && key !== 'club_ids') {
        updates.push(`${dbField} = $${paramIndex}`);
        values.push((data as any)[key]);
        paramIndex++;
      }
    }

    if (updates.length === 0 && !data.club_ids) {
      return this.findById(id);
    }

    let troop: Troop | null = null;

    if (updates.length > 0) {
      values.push(id);
      const result = await query(
        `UPDATE troops SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values,
      );
      troop = result.rows[0] || null;
    } else {
      troop = await this.findById(id);
    }

    // Update club visibility if provided
    if (data.club_ids && troop) {
      // Remove existing clubs
      await query('DELETE FROM troop_clubs WHERE troop_id = $1', [id]);

      // Add new clubs
      for (const clubId of data.club_ids) {
        await query(
          'INSERT INTO troop_clubs (troop_id, club_id, enabled) VALUES ($1, $2, true)',
          [id, clubId],
        );
      }
    }

    return troop;
  }

  /**
   * Delete a troop
   */
  static async delete(id: number): Promise<boolean> {
    const result = await query(
      'DELETE FROM troops WHERE id = $1 RETURNING id',
      [id],
    );

    return result.rows.length > 0;
  }

  /**
   * Check if user can modify troop (is admin of the club that created it)
   */
  static async canUserModify(troopId: number, userId: number): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM troops t
       INNER JOIN club_members cm ON t.created_by_club_id = cm.club_id
       WHERE t.id = $1 AND cm.user_id = $2 AND cm.role IN ('admin', 'super_admin')
       LIMIT 1`,
      [troopId, userId],
    );

    return result.rows.length > 0;
  }

  /**
   * Check if user is an admin for a specific troop
   * (either created the troop or is admin of one of the visible clubs)
   */
  static async isTroopAdmin(troopId: number, userId: number): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM troops t
       WHERE t.id = $1 AND (
         t.created_by = $2 OR
         EXISTS (
           SELECT 1 FROM troop_clubs tc
           INNER JOIN club_members cm ON tc.club_id = cm.club_id
           WHERE tc.troop_id = t.id AND cm.user_id = $2 AND cm.role IN ('admin', 'super_admin')
         )
       )
       LIMIT 1`,
      [troopId, userId],
    );

    return result.rows.length > 0;
  }

  /**
   * Search troops by event name, venue, or city
   */
  static async search(userId: number, searchQuery: string, limit: number = 20): Promise<TroopWithDetails[]> {
    const searchPattern = `%${searchQuery}%`;

    const result = await query(
      `SELECT DISTINCT
        t.*,
        u.username as creator_username,
        c.name as creator_club_name,
        (SELECT COUNT(*) FROM troop_attendees ta WHERE ta.troop_id = t.id) as attendee_count,
        EXISTS(SELECT 1 FROM troop_attendees ta WHERE ta.troop_id = t.id AND ta.user_id = $1) as is_attending
       FROM troops t
       LEFT JOIN users u ON t.created_by = u.id
       LEFT JOIN clubs c ON t.created_by_club_id = c.id
       INNER JOIN troop_clubs tc ON t.id = tc.troop_id AND tc.enabled = true
       INNER JOIN club_members cm ON tc.club_id = cm.club_id AND cm.user_id = $1
       WHERE t.event_name ILIKE $2
          OR t.venue_name ILIKE $2
          OR t.city ILIKE $2
          OR t.description ILIKE $2
       ORDER BY t.event_date DESC
       LIMIT $3`,
      [userId, searchPattern, limit],
    );

    return result.rows;
  }
}
