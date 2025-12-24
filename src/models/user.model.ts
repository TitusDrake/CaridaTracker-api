import { query } from '../config/database';
import { User, UserCreateInput } from '../types';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export class UserModel {
  static async create(userData: UserCreateInput): Promise<User> {
    const password_hash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO users (email, username, password_hash, first_name, last_name, phone_number, tkid)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, email, username, first_name, last_name, phone_number, tkid, created_at, updated_at`,
      [
        userData.email,
        userData.username,
        password_hash,
        userData.firstName || null,
        userData.lastName || null,
        userData.phoneNumber || null,
        userData.tkid || null
      ]
    );

    return result.rows[0];
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    return result.rows[0] || null;
  }

  static async findByUsername(username: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    return result.rows[0] || null;
  }

  static async findByEmailOrUsername(identifier: string): Promise<User | null> {
    // Try email first, then username
    const result = await query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [identifier]
    );

    return result.rows[0] || null;
  }

  static async findById(id: number): Promise<User | null> {
    const result = await query(
      'SELECT id, email, username, first_name, last_name, phone_number, tkid, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );

    return result.rows[0] || null;
  }

  static async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static async emailExists(email: string): Promise<boolean> {
    const result = await query(
      'SELECT EXISTS(SELECT 1 FROM users WHERE email = $1)',
      [email]
    );

    return result.rows[0].exists;
  }

  static async usernameExists(username: string): Promise<boolean> {
    const result = await query(
      'SELECT EXISTS(SELECT 1 FROM users WHERE username = $1)',
      [username]
    );

    return result.rows[0].exists;
  }

  /**
   * Get all club memberships for a user with club and organization details
   */
  static async getClubMemberships(userId: number): Promise<any[]> {
    const result = await query(
      `SELECT
        cm.id as membership_id,
        cm.role,
        cm.joined_at,
        c.id as club_id,
        c.name as club_name,
        c.description as club_description,
        c.location as club_location,
        o.id as organization_id,
        o.name as organization_name
       FROM club_members cm
       INNER JOIN clubs c ON cm.club_id = c.id
       INNER JOIN organizations o ON c.organization_id = o.id
       WHERE cm.user_id = $1
       ORDER BY o.name, c.name`,
      [userId]
    );

    return result.rows;
  }

  /**
   * Get global stats for a user (across all clubs)
   */
  static async getGlobalStats(userId: number): Promise<any> {
    const result = await query(
      `SELECT
        COUNT(DISTINCT ta.troop_id) as total_troops,
        COUNT(DISTINCT ta.club_id) as clubs_attended_as,
        COUNT(DISTINCT t.id) FILTER (WHERE t.event_date >= CURRENT_DATE) as upcoming_troops,
        COUNT(DISTINCT t.id) FILTER (WHERE t.event_date < CURRENT_DATE) as past_troops,
        MIN(t.event_date) FILTER (WHERE t.event_date >= CURRENT_DATE) as next_troop_date
       FROM troop_attendees ta
       INNER JOIN troops t ON ta.troop_id = t.id
       WHERE ta.user_id = $1`,
      [userId]
    );

    return result.rows[0];
  }

  /**
   * Get stats for a user within a specific club
   */
  static async getClubStats(userId: number, clubId: number): Promise<any> {
    const result = await query(
      `SELECT
        COUNT(DISTINCT ta.troop_id) as total_troops,
        COUNT(DISTINCT t.id) FILTER (WHERE t.event_date >= CURRENT_DATE) as upcoming_troops,
        COUNT(DISTINCT t.id) FILTER (WHERE t.event_date < CURRENT_DATE) as past_troops,
        MIN(t.event_date) FILTER (WHERE t.event_date >= CURRENT_DATE) as next_troop_date,
        MAX(t.event_date) FILTER (WHERE t.event_date < CURRENT_DATE) as last_troop_date
       FROM troop_attendees ta
       INNER JOIN troops t ON ta.troop_id = t.id
       WHERE ta.user_id = $1 AND ta.club_id = $2`,
      [userId, clubId]
    );

    // Also get club info
    const clubResult = await query(
      `SELECT c.*, o.name as organization_name
       FROM clubs c
       INNER JOIN organizations o ON c.organization_id = o.id
       WHERE c.id = $1`,
      [clubId]
    );

    return {
      ...result.rows[0],
      club: clubResult.rows[0] || null,
    };
  }

  /**
   * Search users by username, first name, or last name
   */
  static async search(searchQuery: string, limit: number = 20): Promise<any[]> {
    const searchPattern = `%${searchQuery}%`;

    const result = await query(
      `SELECT
        u.id,
        u.username,
        u.first_name,
        u.last_name,
        u.tkid,
        array_agg(DISTINCT c.name) as clubs
       FROM users u
       LEFT JOIN club_members cm ON u.id = cm.user_id
       LEFT JOIN clubs c ON cm.club_id = c.id
       WHERE u.username ILIKE $1
          OR u.first_name ILIKE $1
          OR u.last_name ILIKE $1
          OR u.tkid ILIKE $1
       GROUP BY u.id, u.username, u.first_name, u.last_name, u.tkid
       ORDER BY u.username
       LIMIT $2`,
      [searchPattern, limit]
    );

    return result.rows;
  }
}
