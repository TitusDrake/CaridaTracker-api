import { testRequest, createTestUser, authRequest, cleanupTestData, closeDatabase } from './helpers';
import { query } from '../config/database';

describe('Troops API', () => {
  let adminUser: { user: any; token: string; credentials: any };
  let memberUser: { user: any; token: string; credentials: any };
  let adminClubId: number;

  beforeAll(async () => {
    // Make sure we have the test user as an admin
    // First, create a regular user
    adminUser = await createTestUser({
      email: `admin${Date.now()}@test.com`,
      username: `adminuser${Date.now()}`,
    });

    // Make them an admin for club 1
    adminClubId = 1;
    await query(
      `UPDATE club_members SET role = 'admin' WHERE user_id = $1 AND club_id = $2`,
      [adminUser.user.id, adminClubId]
    );

    // Create a regular member
    memberUser = await createTestUser({
      email: `member${Date.now()}@test.com`,
      username: `memberuser${Date.now()}`,
    });
  });

  afterAll(async () => {
    await cleanupTestData();
    await closeDatabase();
  });

  describe('GET /api/troops', () => {
    it('should require authentication', async () => {
      const response = await testRequest().get('/api/troops');
      expect(response.status).toBe(401);
    });

    it('should return empty array when no troops exist', async () => {
      const response = await authRequest(memberUser.token).get('/api/troops');
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('POST /api/troops', () => {
    it('should require authentication', async () => {
      const response = await testRequest()
        .post('/api/troops')
        .send({
          event_name: 'Test Troop',
          event_date: '2025-06-15',
          created_by_club_id: adminClubId,
        });
      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      const response = await authRequest(memberUser.token)
        .post('/api/troops')
        .send({
          event_name: 'Test Troop',
          event_date: '2025-06-15',
          created_by_club_id: adminClubId,
        });
      expect(response.status).toBe(403);
      expect(response.body.error).toContain('admin');
    });

    it('should create a troop when admin', async () => {
      const response = await authRequest(adminUser.token)
        .post('/api/troops')
        .send({
          event_name: 'Star Wars Day Event',
          event_date: '2025-05-04',
          venue_name: 'Convention Center',
          city: 'Philadelphia',
          state: 'PA',
          start_time: '10:00',
          end_time: '16:00',
          created_by_club_id: adminClubId,
        });

      expect(response.status).toBe(201);
      expect(response.body.event_name).toBe('Star Wars Day Event');
      expect(response.body.venue_name).toBe('Convention Center');
      expect(response.body.city).toBe('Philadelphia');
      expect(response.body.creator_username).toBe(adminUser.user.username);
    });

    it('should require event_name and event_date', async () => {
      const response = await authRequest(adminUser.token)
        .post('/api/troops')
        .send({
          created_by_club_id: adminClubId,
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/troops/:id', () => {
    let testTroopId: number;

    beforeAll(async () => {
      // Create a test troop
      const response = await authRequest(adminUser.token)
        .post('/api/troops')
        .send({
          event_name: 'Test Troop for Get',
          event_date: '2025-07-04',
          created_by_club_id: adminClubId,
        });
      testTroopId = response.body.id;
    });

    it('should require authentication', async () => {
      const response = await testRequest().get(`/api/troops/${testTroopId}`);
      expect(response.status).toBe(401);
    });

    it('should return troop details', async () => {
      const response = await authRequest(memberUser.token).get(`/api/troops/${testTroopId}`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testTroopId);
      expect(response.body.event_name).toBe('Test Troop for Get');
      expect(response.body.clubs).toBeDefined();
      expect(Array.isArray(response.body.clubs)).toBe(true);
    });

    it('should return 404 for non-existent troop', async () => {
      const response = await authRequest(memberUser.token).get('/api/troops/99999');
      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid ID', async () => {
      const response = await authRequest(memberUser.token).get('/api/troops/invalid');
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/troops/:id', () => {
    let testTroopId: number;

    beforeAll(async () => {
      const response = await authRequest(adminUser.token)
        .post('/api/troops')
        .send({
          event_name: 'Test Troop for Update',
          event_date: '2025-08-15',
          created_by_club_id: adminClubId,
        });
      testTroopId = response.body.id;
    });

    it('should require authentication', async () => {
      const response = await testRequest()
        .put(`/api/troops/${testTroopId}`)
        .send({ event_name: 'Updated Name' });
      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      const response = await authRequest(memberUser.token)
        .put(`/api/troops/${testTroopId}`)
        .send({ event_name: 'Updated Name' });
      expect(response.status).toBe(403);
    });

    it('should update troop when admin', async () => {
      const response = await authRequest(adminUser.token)
        .put(`/api/troops/${testTroopId}`)
        .send({
          event_name: 'Updated Event Name',
          venue_name: 'New Venue',
        });

      expect(response.status).toBe(200);
      expect(response.body.event_name).toBe('Updated Event Name');
      expect(response.body.venue_name).toBe('New Venue');
    });

    it('should return 404 for non-existent troop', async () => {
      const response = await authRequest(adminUser.token)
        .put('/api/troops/99999')
        .send({ event_name: 'Updated Name' });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/troops/:id', () => {
    let testTroopId: number;

    beforeEach(async () => {
      const response = await authRequest(adminUser.token)
        .post('/api/troops')
        .send({
          event_name: 'Test Troop for Delete',
          event_date: '2025-09-01',
          created_by_club_id: adminClubId,
        });
      testTroopId = response.body.id;
    });

    it('should require authentication', async () => {
      const response = await testRequest().delete(`/api/troops/${testTroopId}`);
      expect(response.status).toBe(401);
    });

    it('should require admin role', async () => {
      const response = await authRequest(memberUser.token).delete(`/api/troops/${testTroopId}`);
      expect(response.status).toBe(403);
    });

    it('should delete troop when admin', async () => {
      const response = await authRequest(adminUser.token).delete(`/api/troops/${testTroopId}`);
      expect(response.status).toBe(204);

      // Verify it's deleted
      const getResponse = await authRequest(adminUser.token).get(`/api/troops/${testTroopId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent troop', async () => {
      const response = await authRequest(adminUser.token).delete('/api/troops/99999');
      expect(response.status).toBe(404);
    });
  });
});
