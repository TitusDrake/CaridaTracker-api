import { Request, Response } from 'express';
import { OrganizationModel } from '../models/organization.model';

export class OrganizationController {
  static async getAll(_req: Request, res: Response): Promise<void> {
    try {
      const organizations = await OrganizationModel.findAll();
      res.json(organizations);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  static async getById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id) || id < 1) {
        res.status(400).json({ error: 'Invalid organization ID' });
        return;
      }

      const organization = await OrganizationModel.findById(id);
      if (!organization) {
        res.status(404).json({ error: 'Organization not found' });
        return;
      }

      res.json(organization);
    } catch (error) {
      console.error('Error fetching organization:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}



