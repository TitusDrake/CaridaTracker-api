import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { ClubModel } from '../models/club.model';
import { generateToken } from '../utils/jwt';
import { AuthResponse, UserCreateInput, UserLoginInput } from '../types';
import { validationResult } from 'express-validator';
import { query } from '../config/database';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const {
        email,
        username,
        password,
        firstName,
        lastName,
        phoneNumber,
        tkid,
        organizationId,
        clubId,
      }: UserCreateInput = req.body;

      const emailExists = await UserModel.emailExists(email);
      if (emailExists) {
        res.status(400).json({ error: 'Email already registered' });
        return;
      }

      const usernameExists = await UserModel.usernameExists(username);
      if (usernameExists) {
        res.status(400).json({ error: 'Username already taken' });
        return;
      }

      // Validate that both organizationId and clubId are provided (required fields)
      if (!organizationId) {
        res.status(400).json({ error: 'Organization is required' });
        return;
      }
      if (!clubId) {
        res.status(400).json({ error: 'Club is required' });
        return;
      }

      // Validate club exists and belongs to organization
      const club = await ClubModel.findById(clubId);
      if (!club) {
        res.status(400).json({ error: 'Invalid club ID' });
        return;
      }
      if (club.organization_id !== organizationId) {
        res.status(400).json({ error: 'Club does not belong to the specified organization' });
        return;
      }

      // Create the user
      const user = await UserModel.create({
        email,
        username,
        password,
        firstName,
        lastName,
        phoneNumber,
        tkid,
      });

      // Create club_members entry (clubId is required)
      try {
        await query(
          `INSERT INTO club_members (club_id, user_id, role)
           VALUES ($1, $2, $3)
           ON CONFLICT (club_id, user_id) DO NOTHING`,
          [clubId, user.id, 'member'],
        );
      } catch (error) {
        console.error('Error creating club membership:', error);
        // This should not happen since we validated clubId exists, but handle gracefully
        res.status(500).json({ error: 'Failed to create club membership' });
        return;
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name || null,
          lastName: user.last_name || null,
          phoneNumber: user.phone_number || null,
          tkid: user.tkid || null,
        },
        token,
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { emailOrUsername, password }: UserLoginInput = req.body;

      const user = await UserModel.findByEmailOrUsername(emailOrUsername);
      if (!user) {
        res.status(401).json({ error: 'Invalid email/username or password' });
        return;
      }

      const isPasswordValid = await UserModel.verifyPassword(password, user.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      const token = generateToken({
        userId: user.id,
        email: user.email,
        username: user.username,
      });

      const response: AuthResponse = {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          firstName: user.first_name || null,
          lastName: user.last_name || null,
          phoneNumber: user.phone_number || null,
          tkid: user.tkid || null,
        },
        token,
      };

      res.json(response);
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const user = await UserModel.findById(req.user.userId);
      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.first_name || null,
        lastName: user.last_name || null,
        phoneNumber: user.phone_number || null,
        tkid: user.tkid || null,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
