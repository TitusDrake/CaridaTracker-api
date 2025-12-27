import { Request, Response } from 'express';
import { Legion501CostumesResponse } from '../types';

const LEGION_501_API_BASE = 'https://www.501st.com/memberAPI/v3';

/**
 * Extract Legion ID from TKID (e.g., "TK-12345" -> "12345")
 */
function extractLegionId(tkid: string): string | null {
  // TKID format is typically "XX-NNNNN" where XX is prefix (TK, TD, etc.) and NNNNN is the number
  const match = tkid.match(/^[A-Z]{2,3}-?(\d+)$/i);
  return match ? match[1] : null;
}

export class CostumeController {
  /**
   * GET /api/costumes/501st/:legionId
   * Fetch costumes for a 501st Legion member by their Legion ID
   */
  static async get501stCostumes(req: Request, res: Response): Promise<void> {
    try {
      const { legionId } = req.params;

      if (!legionId || !/^\d+$/.test(legionId)) {
        res.status(400).json({ error: 'Invalid Legion ID' });
        return;
      }

      const response = await fetch(`${LEGION_501_API_BASE}/legionId/${legionId}/costumes`);

      if (!response.ok) {
        if (response.status === 404) {
          res.status(404).json({ error: 'Member not found in 501st Legion' });
          return;
        }
        res.status(502).json({ error: 'Failed to fetch costumes from 501st Legion API' });
        return;
      }

      const data = await response.json() as Legion501CostumesResponse;

      // Return the costumes array, or empty array if not found
      res.json(data.costumes || []);
    } catch (error) {
      console.error('Error fetching 501st costumes:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }

  /**
   * GET /api/costumes/my-costumes
   * Fetch costumes for the authenticated user based on their TKID
   */
  static async getMyCostumes(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Authentication required' });
        return;
      }

      // Get user's TKID from database
      const { query } = await import('../config/database');
      const userResult = await query(
        'SELECT tkid FROM users WHERE id = $1',
        [req.user.userId],
      );

      if (userResult.rows.length === 0) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const tkid = userResult.rows[0].tkid;

      if (!tkid) {
        // User doesn't have a TKID set, return empty array
        res.json([]);
        return;
      }

      const legionId = extractLegionId(tkid);

      if (!legionId) {
        res.status(400).json({ error: 'Invalid TKID format. Expected format: TK-12345' });
        return;
      }

      const response = await fetch(`${LEGION_501_API_BASE}/legionId/${legionId}/costumes`);

      if (!response.ok) {
        if (response.status === 404) {
          // Member not found, return empty array
          res.json([]);
          return;
        }
        res.status(502).json({ error: 'Failed to fetch costumes from 501st Legion API' });
        return;
      }

      const data = await response.json() as Legion501CostumesResponse;

      res.json(data.costumes || []);
    } catch (error) {
      console.error('Error fetching my costumes:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
