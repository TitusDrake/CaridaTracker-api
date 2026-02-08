import crypto from 'crypto';
import { query } from '../config/database';

export interface PasswordResetToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export class PasswordResetModel {
  /**
   * Generate a secure random token
   */
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a password reset token for a user
   * Invalidates any existing tokens for the user
   */
  static async createToken(userId: number): Promise<string> {
    // Delete any existing tokens for this user
    await query('DELETE FROM password_reset_tokens WHERE user_id = $1', [userId]);

    // Generate new token
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await query(
      `INSERT INTO password_reset_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt],
    );

    return token;
  }

  /**
   * Find a valid (unused, unexpired) token
   */
  static async findValidToken(token: string): Promise<PasswordResetToken | null> {
    const result = await query(
      `SELECT * FROM password_reset_tokens
       WHERE token = $1
         AND used_at IS NULL
         AND expires_at > NOW()`,
      [token],
    );

    return result.rows[0] || null;
  }

  /**
   * Mark a token as used
   */
  static async markTokenUsed(tokenId: number): Promise<void> {
    await query(
      `UPDATE password_reset_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [tokenId],
    );
  }

  /**
   * Find user by email
   */
  static async findUserByEmail(email: string): Promise<{ id: number; email: string } | null> {
    const result = await query('SELECT id, email FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
  }

  /**
   * Update user password
   */
  static async updatePassword(userId: number, passwordHash: string): Promise<void> {
    await query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [
      passwordHash,
      userId,
    ]);
  }

  /**
   * Clean up expired tokens (can be called periodically)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await query(
      `DELETE FROM password_reset_tokens
       WHERE expires_at < NOW() OR used_at IS NOT NULL
       RETURNING id`,
    );
    return result.rowCount || 0;
  }
}
