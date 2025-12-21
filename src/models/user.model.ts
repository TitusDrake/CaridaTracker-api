import { query } from '../config/database';
import { User, UserCreateInput } from '../types';
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export class UserModel {
  static async create(userData: UserCreateInput): Promise<User> {
    const password_hash = await bcrypt.hash(userData.password, SALT_ROUNDS);

    const result = await query(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, email, username, created_at, updated_at`,
      [userData.email, userData.username, password_hash]
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

  static async findById(id: number): Promise<User | null> {
    const result = await query(
      'SELECT id, email, username, created_at, updated_at FROM users WHERE id = $1',
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
}
