import crypto from 'crypto';
import { query } from '../config/database';

export interface EmailVerificationToken {
  id: number;
  user_id: number;
  token: string;
  expires_at: Date;
  used_at: Date | null;
  created_at: Date;
}

export class EmailVerificationModel {
  /**
   * Generate a secure random token
   */
  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create an email verification token for a user
   * Invalidates any existing tokens for the user
   */
  static async createToken(userId: number): Promise<string> {
    // Delete any existing tokens for this user
    await query('DELETE FROM email_verification_tokens WHERE user_id = $1', [userId]);

    // Generate new token
    const token = this.generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    await query(
      `INSERT INTO email_verification_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt],
    );

    return token;
  }

  /**
   * Find a valid (unused, unexpired) token
   */
  static async findValidToken(token: string): Promise<EmailVerificationToken | null> {
    const result = await query(
      `SELECT * FROM email_verification_tokens
       WHERE token = $1
         AND used_at IS NULL
         AND expires_at > NOW()`,
      [token],
    );

    return result.rows[0] || null;
  }

  /**
   * Mark a token as used and verify the user's email
   */
  static async verifyEmail(tokenId: number, userId: number): Promise<void> {
    // Mark token as used
    await query(
      `UPDATE email_verification_tokens
       SET used_at = NOW()
       WHERE id = $1`,
      [tokenId],
    );

    // Mark user email as verified
    await query(
      `UPDATE users
       SET email_verified = true, email_verified_at = NOW(), updated_at = NOW()
       WHERE id = $1`,
      [userId],
    );
  }

  /**
   * Check if user's email is verified
   */
  static async isEmailVerified(userId: number): Promise<boolean> {
    const result = await query('SELECT email_verified FROM users WHERE id = $1', [userId]);
    return result.rows[0]?.email_verified || false;
  }

  /**
   * Get user by ID with email info
   */
  static async getUserById(userId: number): Promise<{ id: number; email: string; email_verified: boolean } | null> {
    const result = await query('SELECT id, email, email_verified FROM users WHERE id = $1', [userId]);
    return result.rows[0] || null;
  }

  /**
   * Clean up expired tokens (can be called periodically)
   */
  static async cleanupExpiredTokens(): Promise<number> {
    const result = await query(
      `DELETE FROM email_verification_tokens
       WHERE expires_at < NOW() OR used_at IS NOT NULL
       RETURNING id`,
    );
    return result.rowCount || 0;
  }
}
