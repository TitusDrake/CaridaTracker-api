import { query } from '../config/database';
import { Club, ClubWithOrganization } from '../types';

export class ClubModel {
  static async findAll(): Promise<Club[]> {
    const result = await query(
      'SELECT id, organization_id, name, description, location, created_at, updated_at FROM clubs ORDER BY name ASC',
      [],
    );

    return result.rows;
  }

  static async findByOrganizationId(organizationId: number): Promise<Club[]> {
    const result = await query(
      'SELECT id, organization_id, name, description, location, created_at, updated_at FROM clubs WHERE organization_id = $1 ORDER BY name ASC',
      [organizationId],
    );

    return result.rows;
  }

  static async findById(id: number): Promise<Club | null> {
    const result = await query(
      'SELECT id, organization_id, name, description, location, created_at, updated_at FROM clubs WHERE id = $1',
      [id],
    );

    return result.rows[0] || null;
  }

  static async findByIdWithOrganization(id: number): Promise<ClubWithOrganization | null> {
    const result = await query(
      `SELECT 
        c.id, 
        c.organization_id, 
        c.name, 
        c.description, 
        c.location, 
        c.created_at, 
        c.updated_at,
        json_build_object(
          'id', o.id,
          'name', o.name,
          'description', o.description,
          'created_at', o.created_at,
          'updated_at', o.updated_at
        ) as organization
      FROM clubs c
      LEFT JOIN organizations o ON c.organization_id = o.id
      WHERE c.id = $1`,
      [id],
    );

    if (!result.rows[0]) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      organization_id: row.organization_id,
      name: row.name,
      description: row.description,
      location: row.location,
      created_at: row.created_at,
      updated_at: row.updated_at,
      organization: row.organization,
    };
  }

  /**
   * Get all members of a club with user details
   */
  static async getMembers(clubId: number): Promise<any[]> {
    const result = await query(
      `SELECT
        cm.id as membership_id,
        cm.role,
        cm.joined_at,
        u.id as user_id,
        u.username,
        u.first_name,
        u.last_name,
        u.email,
        u.tkid
       FROM club_members cm
       INNER JOIN users u ON cm.user_id = u.id
       WHERE cm.club_id = $1
       ORDER BY
         CASE cm.role
           WHEN 'super_admin' THEN 1
           WHEN 'admin' THEN 2
           WHEN 'member' THEN 3
           WHEN 'cadet' THEN 4
           ELSE 5
         END,
         u.username`,
      [clubId],
    );

    return result.rows;
  }

  /**
   * Check if user is an admin of the club
   */
  static async isUserAdmin(clubId: number, userId: number): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM club_members
       WHERE club_id = $1 AND user_id = $2 AND role IN ('admin', 'super_admin')
       LIMIT 1`,
      [clubId, userId],
    );

    return result.rows.length > 0;
  }

  /**
   * Check if user is a member of the club
   */
  static async isUserMember(clubId: number, userId: number): Promise<boolean> {
    const result = await query(
      `SELECT 1 FROM club_members
       WHERE club_id = $1 AND user_id = $2
       LIMIT 1`,
      [clubId, userId],
    );

    return result.rows.length > 0;
  }
}



