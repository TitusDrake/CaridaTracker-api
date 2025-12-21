import { Request, Response } from 'express';
import { UserModel } from '../models/user.model';
import { generateToken } from '../utils/jwt';
import { AuthResponse, UserCreateInput, UserLoginInput } from '../types';
import { validationResult } from 'express-validator';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
      }

      const { email, username, password }: UserCreateInput = req.body;

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

      const user = await UserModel.create({ email, username, password });

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

      const { email, password }: UserLoginInput = req.body;

      const user = await UserModel.findByEmail(email);
      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
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
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
