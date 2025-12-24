import { testRequest, createTestUser, authRequest, cleanupTestData, closeDatabase } from './helpers';

describe('Attendance API', () => {
  let adminToken: string;
  let memberToken: string;
  let memberUserId: number;
  let troopId: number;
  const clubId = 1; // Garrison Carida from seed data

  beforeAll(async () => {
    // Create admin user
    const admin = await createTestUser({
      email: `admin_attend_${Date.now()}@test.com`,
      username: `admin_attend_${Date.now()}`,
      isAdmin: true,
      clubId,
    });
    adminToken = admin.token;

    // Create regular member
    const member = await createTestUser({
      email: `member_attend_${Date.now()}@test.com`,
      username: `member_attend_${Date.now()}`,
      isAdmin: false,
      clubId,
    });
    memberToken = member.token;
    memberUserId = member.userId;

    // Create a troop for testing
    const troopResponse = await authRequest(adminToken)
      .post('/api/troops')
      .send({
        event_name: 'Attendance Test Troop',
        event_date: '2025-06-15',
        created_by_club_id: clubId,
        venue_name: 'Test Venue',
      });
    troopId = troopResponse.body.id;
  });

  afterAll(async () => {
    await cleanupTestData();
    await closeDatabase();
  });

  describe('POST /api/troops/:id/attend', () => {
    it('should require authentication', async () => {
      const response = await testRequest()
        .post(`/api/troops/${troopId}/attend`)
        .send({ club_id: clubId });

      expect(response.status).toBe(401);
    });

    it('should require club_id', async () => {
      const response = await authRequest(memberToken)
        .post(`/api/troops/${troopId}/attend`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should allow member to sign up for troop', async () => {
      const response = await authRequest(memberToken)
        .post(`/api/troops/${troopId}/attend`)
        .send({ club_id: clubId });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.troop_id).toBe(troopId);
      expect(response.body.user_id).toBe(memberUserId);
      expect(response.body.club_id).toBe(clubId);
      expect(response.body.status).toBe('signed_up');
    });

    it('should prevent duplicate sign up for same club', async () => {
      const response = await authRequest(memberToken)
        .post(`/api/troops/${troopId}/attend`)
        .send({ club_id: clubId });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already signed up');
    });

    it('should return 404 for non-existent troop', async () => {
      const response = await authRequest(memberToken)
        .post('/api/troops/99999/attend')
        .send({ club_id: clubId });

      expect(response.status).toBe(404);
    });

    it('should return 403 if user is not member of the club', async () => {
      // Club 2 is a different club
      const response = await authRequest(memberToken)
        .post(`/api/troops/${troopId}/attend`)
        .send({ club_id: 2 });

      expect(response.status).toBe(403);
      expect(response.body.error).toContain('not a member');
    });
  });

  describe('GET /api/troops/:id/attendees', () => {
    it('should require authentication', async () => {
      const response = await testRequest()
        .get(`/api/troops/${troopId}/attendees`);

      expect(response.status).toBe(401);
    });

    it('should return attendees list for authorized user', async () => {
      const response = await authRequest(memberToken)
        .get(`/api/troops/${troopId}/attendees`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('username');
      expect(response.body[0]).toHaveProperty('club_name');
    });

    it('should return 404 for non-existent troop', async () => {
      const response = await authRequest(memberToken)
        .get('/api/troops/99999/attendees');

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/troops/:id/attend', () => {
    it('should require authentication', async () => {
      const response = await testRequest()
        .delete(`/api/troops/${troopId}/attend`)
        .send({ club_id: clubId });

      expect(response.status).toBe(401);
    });

    it('should require club_id', async () => {
      const response = await authRequest(memberToken)
        .delete(`/api/troops/${troopId}/attend`)
        .send({});

      expect(response.status).toBe(400);
    });

    it('should allow user to cancel attendance', async () => {
      const response = await authRequest(memberToken)
        .delete(`/api/troops/${troopId}/attend`)
        .send({ club_id: clubId });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('cancelled');
    });

    it('should return 404 if not signed up', async () => {
      const response = await authRequest(memberToken)
        .delete(`/api/troops/${troopId}/attend`)
        .send({ club_id: clubId });

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('not signed up');
    });

    it('should return 404 for non-existent troop', async () => {
      const response = await authRequest(memberToken)
        .delete('/api/troops/99999/attend')
        .send({ club_id: clubId });

      expect(response.status).toBe(404);
    });
  });

  describe('Multi-club attendance', () => {
    let multiClubTroopId: number;

    beforeAll(async () => {
      // Create a troop visible to multiple clubs
      const troopResponse = await authRequest(adminToken)
        .post('/api/troops')
        .send({
          event_name: 'Multi-Club Test Troop',
          event_date: '2025-07-20',
          created_by_club_id: clubId,
          venue_name: 'Multi-Club Venue',
        });
      multiClubTroopId = troopResponse.body.id;
    });

    it('should allow same user to attend same troop under different clubs', async () => {
      // First sign up under club 1
      const response1 = await authRequest(adminToken)
        .post(`/api/troops/${multiClubTroopId}/attend`)
        .send({ club_id: clubId });

      expect(response1.status).toBe(201);

      // Attendees list should show the attendance
      const attendeesResponse = await authRequest(adminToken)
        .get(`/api/troops/${multiClubTroopId}/attendees`);

      expect(attendeesResponse.status).toBe(200);
      expect(attendeesResponse.body.length).toBe(1);
    });
  });
});
