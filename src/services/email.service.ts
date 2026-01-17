import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private initialized = false;

  private async initTransporter(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // If SMTP_HOST is set, use configured SMTP
    if (process.env.SMTP_HOST) {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '1025', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            }
            : undefined,
      });
    } else {
      // Use Ethereal for testing (creates a test account automatically)
      const testAccount = await nodemailer.createTestAccount();
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.log('Using Ethereal test account:', testAccount.user);
      console.log('View emails at: https://ethereal.email/login');
    }

    this.initialized = true;
  }

  private async getTransporter(): Promise<nodemailer.Transporter> {
    await this.initTransporter();
    return this.transporter!;
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    const from = process.env.EMAIL_FROM || 'noreply@caridatracker.local';
    const transporter = await this.getTransporter();

    const info = await transporter.sendMail({
      from,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`Email sent to ${options.to}: ${options.subject}`);

    // If using Ethereal, log the preview URL
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('Preview URL:', previewUrl);
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.APP_URL || 'http://localhost:8081'}/reset-password?token=${resetToken}`;

    await this.sendEmail({
      to,
      subject: 'CaridaTracker - Password Reset Request',
      text: `You requested a password reset. Click the following link to reset your password: ${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your CaridaTracker account.</p>
          <p>Click the button below to reset your password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Reset Password
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">This link will expire in 1 hour.</p>
          <p style="color: #666; font-size: 14px;">If you did not request this, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">CaridaTracker - Troop Management System</p>
        </div>
      `,
    });
  }

  async sendEmailVerification(to: string, verificationToken: string): Promise<void> {
    const verifyUrl = `${process.env.APP_URL || 'http://localhost:8081'}/verify-email?token=${verificationToken}`;

    await this.sendEmail({
      to,
      subject: 'CaridaTracker - Verify Your Email',
      text: `Welcome to CaridaTracker! Please verify your email by clicking the following link: ${verifyUrl}\n\nThis link will expire in 24 hours.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to CaridaTracker!</h2>
          <p>Thank you for registering. Please verify your email address to complete your account setup.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}"
               style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
              Verify Email
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">This link will expire in 24 hours.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">CaridaTracker - Troop Management System</p>
        </div>
      `,
    });
  }

  async sendTroopSignupConfirmation(
    to: string,
    troopName: string,
    eventDate: string,
    clubName: string,
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject: `CaridaTracker - Signup Confirmed: ${troopName}`,
      text: `Your signup for "${troopName}" on ${eventDate} representing ${clubName} has been confirmed!`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Signup Confirmed!</h2>
          <p>Your signup for the following troop has been confirmed:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Event:</strong> ${troopName}</p>
            <p style="margin: 5px 0;"><strong>Date:</strong> ${eventDate}</p>
            <p style="margin: 5px 0;"><strong>Representing:</strong> ${clubName}</p>
          </div>
          <p>We look forward to seeing you there!</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">CaridaTracker - Troop Management System</p>
        </div>
      `,
    });
  }

  async verifyConnection(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      console.log('SMTP connection verified');
      return true;
    } catch (error) {
      console.error('SMTP connection failed:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();
