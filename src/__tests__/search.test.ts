import { testRequest, createTestUser, authRequest, cleanupTestData, closeDatabase } from './helpers';

describe('Search API', () => {
  let adminToken: string;
  let memberToken: string;
  const clubId = 1; // Garrison Carida from seed data

  beforeAll(async () => {
    // Create admin user
    const admin = await createTestUser({
      email: `admin_search_${Date.now()}@test.com`,
      username: `admin_search_${Date.now()}`,
      isAdmin: true,
      clubId,
    });
    adminToken = admin.token;

    // Create regular member
    const member = await createTestUser({
      email: `member_search_${Date.now()}@test.com`,
      username: `member_search_${Date.now()}`,
      isAdmin: false,
      clubId,
    });
    memberToken = member.token;

    // Create a troop for testing
    await authRequest(adminToken)
      .post('/api/troops')
      .send({
        event_name: 'Searchable Test Event',
        event_date: '2025-08-15',
        created_by_club_id: clubId,
        venue_name: 'Search Venue',
        city: 'Pittsburgh',
      });
  });

  afterAll(async () => {
    await cleanupTestData();
    await closeDatabase();
  });

  describe('GET /api/search/troops', () => {
    it('should require authentication', async () => {
      const response = await testRequest()
        .get('/api/search/troops?q=test');

      expect(response.status).toBe(401);
    });

    it('should search troops by event name', async () => {
      const response = await authRequest(memberToken)
        .get('/api/search/troops?q=Searchable');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const troop = response.body[0];
      expect(troop.event_name).toContain('Searchable');
    });

    it('should search troops by venue name', async () => {
      const response = await authRequest(memberToken)
        .get('/api/search/troops?q=Search%20Venue');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should search troops by city', async () => {
      const response = await authRequest(memberToken)
        .get('/api/search/troops?q=Pittsburgh');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should require at least 2 characters', async () => {
      const response = await authRequest(memberToken)
        .get('/api/search/troops?q=a');

      expect(response.status).toBe(400);
    });

    it('should return 400 if query is missing', async () => {
      const response = await authRequest(memberToken)
        .get('/api/search/troops');

      expect(response.status).toBe(400);
    });

    it('should only return troops visible to user', async () => {
      const response = await authRequest(memberToken)
        .get('/api/search/troops?q=Searchable');

      expect(response.status).toBe(200);
      // The troop should be visible because user is a member of the creating club
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /api/search/users', () => {
    it('should require authentication', async () => {
      const response = await testRequest()
        .get('/api/search/users?q=test');

      expect(response.status).toBe(401);
    });

    it('should search users by username', async () => {
      const response = await authRequest(memberToken)
        .get('/api/search/users?q=admin_search');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      const user = response.body[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('username');
    });

    it('should require at least 2 characters', async () => {
      const response = await authRequest(memberToken)
        .get('/api/search/users?q=a');

      expect(response.status).toBe(400);
    });

    it('should return 400 if query is missing', async () => {
      const response = await authRequest(memberToken)
        .get('/api/search/users');

      expect(response.status).toBe(400);
    });
  });
});
