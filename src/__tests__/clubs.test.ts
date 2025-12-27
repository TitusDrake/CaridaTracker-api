import { testRequest, createTestUser, authRequest, cleanupTestData, closeDatabase } from './helpers';

describe('Clubs API', () => {
  afterAll(async () => {
    await cleanupTestData();
    await closeDatabase();
  });

  describe('GET /api/clubs', () => {
    it('should return all clubs', async () => {
      const response = await testRequest()
        .get('/api/clubs');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check structure of first club
      if (response.body.length > 0) {
        const club = response.body[0];
        expect(club).toHaveProperty('id');
        expect(club).toHaveProperty('name');
        expect(club).toHaveProperty('organization_id');
        expect(club).toHaveProperty('description');
        expect(club).toHaveProperty('location');
      }
    });

    it('should return clubs with organization information', async () => {
      const response = await testRequest()
        .get('/api/clubs');

      expect(response.status).toBe(200);

      // Check if clubs have organization data (if ClubWithOrganization type is used)
      if (response.body.length > 0) {
        const club = response.body[0];
        // Clubs should have organization_id at minimum
        expect(club.organization_id).toBeDefined();
      }
    });
  });

  describe('GET /api/clubs/organization/:organizationId', () => {
    it('should return clubs for a specific organization', async () => {
      // Assuming organization ID 1 exists (from seed data)
      const response = await testRequest()
        .get('/api/clubs/organization/1');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      // All returned clubs should belong to organization 1
      response.body.forEach((club: any) => {
        expect(club.organization_id).toBe(1);
      });
    });

    it('should return empty array for organization with no clubs', async () => {
      // Use a very high organization ID that likely doesn't exist
      const response = await testRequest()
        .get('/api/clubs/organization/99999');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('should return 400 for invalid organization ID', async () => {
      const response = await testRequest()
        .get('/api/clubs/organization/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid organization ID');
    });

    it('should return 400 for negative organization ID', async () => {
      const response = await testRequest()
        .get('/api/clubs/organization/-1');

      expect(response.status).toBe(400);
    });

    it('should return 400 for zero organization ID', async () => {
      const response = await testRequest()
        .get('/api/clubs/organization/0');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/clubs/:id', () => {
    let testClubId: number;

    beforeAll(async () => {
      // Get a club ID from the list
      const clubsResponse = await testRequest()
        .get('/api/clubs');

      if (clubsResponse.body.length > 0) {
        testClubId = clubsResponse.body[0].id;
      } else {
        // Fallback: use ID 1 (from seed data)
        testClubId = 1;
      }
    });

    it('should return club by ID', async () => {
      const response = await testRequest()
        .get(`/api/clubs/${testClubId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('organization_id');
      expect(response.body.id).toBe(testClubId);
    });

    it('should return 404 for non-existent club', async () => {
      const response = await testRequest()
        .get('/api/clubs/99999');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Club not found');
    });

    it('should return 400 for invalid club ID', async () => {
      const response = await testRequest()
        .get('/api/clubs/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid club ID');
    });

    it('should return 400 for negative club ID', async () => {
      const response = await testRequest()
        .get('/api/clubs/-1');

      expect(response.status).toBe(400);
    });

    it('should return 400 for zero club ID', async () => {
      const response = await testRequest()
        .get('/api/clubs/0');

      expect(response.status).toBe(400);
    });
  });

  describe('Club data structure', () => {
    it('should return clubs with all required fields', async () => {
      const response = await testRequest()
        .get('/api/clubs');

      expect(response.status).toBe(200);

      if (response.body.length > 0) {
        const club = response.body[0];
        expect(club).toHaveProperty('id');
        expect(club).toHaveProperty('name');
        expect(club).toHaveProperty('organization_id');
        expect(club).toHaveProperty('description');
        expect(club).toHaveProperty('location');
        expect(club).toHaveProperty('created_at');
        expect(club).toHaveProperty('updated_at');

        // Type checks
        expect(typeof club.id).toBe('number');
        expect(typeof club.name).toBe('string');
        expect(typeof club.organization_id).toBe('number');
      }
    });
  });

  describe('GET /api/clubs/:id/members', () => {
    let memberToken: string;
    const clubId = 1; // Garrison Carida from seed data

    beforeAll(async () => {
      const member = await createTestUser({
        email: `clubmember_${Date.now()}@test.com`,
        username: `clubmember_${Date.now()}`,
        isAdmin: false,
        clubId,
      });
      memberToken = member.token;
    });

    it('should require authentication', async () => {
      const response = await testRequest()
        .get(`/api/clubs/${clubId}/members`);

      expect(response.status).toBe(401);
    });

    it('should return members for a club the user belongs to', async () => {
      const response = await authRequest(memberToken)
        .get(`/api/clubs/${clubId}/members`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const member = response.body[0];
      expect(member).toHaveProperty('membership_id');
      expect(member).toHaveProperty('role');
      expect(member).toHaveProperty('user_id');
      expect(member).toHaveProperty('username');
    });

    it('should return 403 for non-member club', async () => {
      // Create a user in a different club (Kyber Base is org 2, club 2)
      const otherUser = await createTestUser({
        email: `otherclub_${Date.now()}@test.com`,
        username: `otherclub_${Date.now()}`,
        isAdmin: false,
        organizationId: 2,
        clubId: 2, // Kyber Base - different club
      });

      const response = await authRequest(otherUser.token)
        .get(`/api/clubs/${clubId}/members`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent club', async () => {
      const response = await authRequest(memberToken)
        .get('/api/clubs/99999/members');

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid club ID', async () => {
      const response = await authRequest(memberToken)
        .get('/api/clubs/invalid/members');

      expect(response.status).toBe(400);
    });
  });
});



