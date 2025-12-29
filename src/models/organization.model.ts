import { query } from '../config/database';
import { Organization } from '../types';

export class OrganizationModel {
  static async findAll(): Promise<Organization[]> {
    const result = await query(
      'SELECT id, name, description, created_at, updated_at FROM organizations ORDER BY name ASC',
      [],
    );

    return result.rows;
  }

  static async findById(id: number): Promise<Organization | null> {
    const result = await query(
      'SELECT id, name, description, created_at, updated_at FROM organizations WHERE id = $1',
      [id],
    );

    return result.rows[0] || null;
  }
}



