import { Request, Response } from 'express';
import { EmailVerificationModel } from '../models/emailVerification.model';
import { emailService } from '../services/email.service';

export class EmailVerificationController {
  /**
   * POST /api/auth/send-verification
   * Send a verification email to the current user
   */
  static async sendVerification(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Get user info
      const user = await EmailVerificationModel.getUserById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Check if already verified
      if (user.email_verified) {
        res.status(400).json({ error: 'Email is already verified' });
        return;
      }

      // Create verification token
      const token = await EmailVerificationModel.createToken(user.id);

      // Send email
      try {
        await emailService.sendEmailVerification(user.email, token);
      } catch (emailError) {
        console.error('Failed to send verification email:', emailError);
        res.status(500).json({ error: 'Failed to send verification email' });
        return;
      }

      res.json({ message: 'Verification email sent' });
    } catch (error) {
      console.error('Error sending verification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * POST /api/auth/verify-email
   * Verify email using token
   */
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    try {
      const { token } = req.body;

      if (!token) {
        res.status(400).json({ error: 'Verification token is required' });
        return;
      }

      // Find valid token
      const verificationToken = await EmailVerificationModel.findValidToken(token);
      if (!verificationToken) {
        res.status(400).json({
          error: 'Invalid or expired verification token. Please request a new verification email.',
        });
        return;
      }

      // Verify email
      await EmailVerificationModel.verifyEmail(verificationToken.id, verificationToken.user_id);

      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Error verifying email:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/auth/verification-status
   * Check if current user's email is verified
   */
  static async getVerificationStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      const isVerified = await EmailVerificationModel.isEmailVerified(req.user.userId);

      res.json({ email_verified: isVerified });
    } catch (error) {
      console.error('Error getting verification status:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
