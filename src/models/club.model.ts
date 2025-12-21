import { query } from '../config/database';
import { Club, ClubWithOrganization } from '../types';

export class ClubModel {
  static async findAll(): Promise<Club[]> {
    const result = await query(
      'SELECT id, organization_id, name, description, location, created_at, updated_at FROM clubs ORDER BY name ASC',
      []
    );

    return result.rows;
  }

  static async findByOrganizationId(organizationId: number): Promise<Club[]> {
    const result = await query(
      'SELECT id, organization_id, name, description, location, created_at, updated_at FROM clubs WHERE organization_id = $1 ORDER BY name ASC',
      [organizationId]
    );

    return result.rows;
  }

  static async findById(id: number): Promise<Club | null> {
    const result = await query(
      'SELECT id, organization_id, name, description, location, created_at, updated_at FROM clubs WHERE id = $1',
      [id]
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
      [id]
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
}



