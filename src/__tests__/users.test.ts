import { testRequest, createTestUser, authRequest, cleanupTestData, closeDatabase } from './helpers';

describe('Users API', () => {
  let memberToken: string;
  const clubId = 1; // Garrison Carida from seed data

  beforeAll(async () => {
    // Create a regular member
    const member = await createTestUser({
      email: `member_user_${Date.now()}@test.com`,
      username: `member_user_${Date.now()}`,
      firstName: 'Test',
      lastName: 'Member',
      isAdmin: false,
      clubId,
    });
    memberToken = member.token;
  });

  afterAll(async () => {
    await cleanupTestData();
    await closeDatabase();
  });

  describe('GET /api/users/me/clubs', () => {
    it('should require authentication', async () => {
      const response = await testRequest()
        .get('/api/users/me/clubs');

      expect(response.status).toBe(401);
    });

    it('should return user club memberships', async () => {
      const response = await authRequest(memberToken)
        .get('/api/users/me/clubs');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const membership = response.body[0];
      expect(membership).toHaveProperty('membership_id');
      expect(membership).toHaveProperty('role');
      expect(membership).toHaveProperty('club_id');
      expect(membership).toHaveProperty('club_name');
      expect(membership).toHaveProperty('organization_id');
      expect(membership).toHaveProperty('organization_name');
    });
  });

  describe('GET /api/users/me/stats', () => {
    it('should require authentication', async () => {
      const response = await testRequest()
        .get('/api/users/me/stats');

      expect(response.status).toBe(401);
    });

    it('should return user global stats', async () => {
      const response = await authRequest(memberToken)
        .get('/api/users/me/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_troops');
      expect(response.body).toHaveProperty('clubs_attended_as');
      expect(response.body).toHaveProperty('upcoming_troops');
      expect(response.body).toHaveProperty('past_troops');

      expect(typeof response.body.total_troops).toBe('number');
      expect(typeof response.body.clubs_attended_as).toBe('number');
    });
  });

  describe('GET /api/users/me/clubs/:clubId/stats', () => {
    it('should require authentication', async () => {
      const response = await testRequest()
        .get(`/api/users/me/clubs/${clubId}/stats`);

      expect(response.status).toBe(401);
    });

    it('should return stats for a specific club', async () => {
      const response = await authRequest(memberToken)
        .get(`/api/users/me/clubs/${clubId}/stats`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('total_troops');
      expect(response.body).toHaveProperty('upcoming_troops');
      expect(response.body).toHaveProperty('past_troops');
      expect(response.body).toHaveProperty('club');
      expect(response.body.club).toHaveProperty('name');
    });

    it('should return 403 for non-member club', async () => {
      // Club 2 is a different club user is not a member of
      const response = await authRequest(memberToken)
        .get('/api/users/me/clubs/2/stats');

      expect(response.status).toBe(403);
    });

    it('should return 400 for invalid club ID', async () => {
      const response = await authRequest(memberToken)
        .get('/api/users/me/clubs/invalid/stats');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/users/search', () => {
    it('should require authentication', async () => {
      const response = await testRequest()
        .get('/api/users/search?q=test');

      expect(response.status).toBe(401);
    });

    it('should search users by username', async () => {
      const response = await authRequest(memberToken)
        .get('/api/users/search?q=member_user');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require at least 2 characters', async () => {
      const response = await authRequest(memberToken)
        .get('/api/users/search?q=a');

      expect(response.status).toBe(400);
    });

    it('should return 400 if query is missing', async () => {
      const response = await authRequest(memberToken)
        .get('/api/users/search');

      expect(response.status).toBe(400);
    });
  });
});
