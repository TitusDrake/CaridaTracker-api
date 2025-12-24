import { Request, Response } from 'express';
import { ClubModel } from '../models/club.model';

export class ClubController {
  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const clubs = await ClubModel.findAll();
      res.json(clubs);
    } catch (error) {
      console.error('Error fetching clubs:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getByOrganization(req: Request, res: Response): Promise<void> {
    try {
      const organizationId = parseInt(req.params.organizationId, 10);
      if (isNaN(organizationId) || organizationId < 1) {
        res.status(400).json({ error: 'Invalid organization ID' });
        return;
      }

      const clubs = await ClubModel.findByOrganizationId(organizationId);
      res.json(clubs);
    } catch (error) {
      console.error('Error fetching clubs by organization:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id < 1) {
        res.status(400).json({ error: 'Invalid club ID' });
        return;
      }

      const club = await ClubModel.findById(id);
      if (!club) {
        res.status(404).json({ error: 'Club not found' });
        return;
      }

      res.json(club);
    } catch (error) {
      console.error('Error fetching club:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}



