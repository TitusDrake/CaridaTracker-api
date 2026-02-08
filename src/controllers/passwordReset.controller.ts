import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { PasswordResetModel } from '../models/passwordReset.model';
import { emailService } from '../services/email.service';

export class PasswordResetController {
  /**
   * POST /api/auth/forgot-password
   * Request a password reset email
   */
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email } = req.body;

      // Find user by email
      const user = await PasswordResetModel.findUserByEmail(email);

      // Always return success to prevent email enumeration
      // Even if user doesn't exist, we don't reveal that
      if (!user) {
        res.json({
          message: 'If an account with that email exists, a password reset link has been sent.',
        });
        return;
      }

      // Create reset token
      const token = await PasswordResetModel.createToken(user.id);

      // Send email
      try {
        await emailService.sendPasswordResetEmail(user.email, token);
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        // Don't expose email sending failures to the user
      }

      res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    } catch (error) {
      console.error('Error in forgot password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/auth/reset-password
   * Reset password using token
   */
  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { token, password } = req.body;

      // Find valid token
      const resetToken = await PasswordResetModel.findValidToken(token);
      if (!resetToken) {
        res.status(400).json({
          error: 'Invalid or expired reset token. Please request a new password reset.',
        });
        return;
      }

      // Hash new password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Update password
      await PasswordResetModel.updatePassword(resetToken.user_id, passwordHash);

      // Mark token as used
      await PasswordResetModel.markTokenUsed(resetToken.id);

      res.json({ message: 'Password has been reset successfully. You can now log in.' });
    } catch (error) {
      console.error('Error in reset password:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/auth/verify-reset-token/:token
   * Verify if a reset token is valid (for frontend validation)
   */
  static async verifyResetToken(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      if (!token) {
        res.status(400).json({ error: 'Token is required' });
        return;
      }

      const resetToken = await PasswordResetModel.findValidToken(token);

      if (!resetToken) {
        res.status(400).json({ valid: false, error: 'Invalid or expired reset token' });
        return;
      }

      res.json({ valid: true });
    } catch (error) {
      console.error('Error verifying reset token:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
