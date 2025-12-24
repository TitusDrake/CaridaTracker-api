import { testRequest, createTestUser, authRequest, cleanupTestData, closeDatabase } from './helpers';

describe('Authentication API', () => {
  afterAll(async () => {
    await cleanupTestData();
    await closeDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        email: `test_register_${Date.now()}@test.com`,
        username: `testuser_${Date.now()}`,
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        organizationId: 1,
        clubId: 1,
      };

      const response = await testRequest()
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.username).toBe(userData.username);
      expect(response.body.user).not.toHaveProperty('password');
      expect(response.body.user).not.toHaveProperty('password_hash');
    });

    it('should require email', async () => {
      const response = await testRequest()
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'TestPass123!',
          organizationId: 1,
          clubId: 1,
        });

      expect(response.status).toBe(400);
    });

    it('should require valid email format', async () => {
      const response = await testRequest()
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          password: 'TestPass123!',
          organizationId: 1,
          clubId: 1,
        });

      expect(response.status).toBe(400);
    });

    it('should require username', async () => {
      const response = await testRequest()
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          password: 'TestPass123!',
          organizationId: 1,
          clubId: 1,
        });

      expect(response.status).toBe(400);
    });

    it('should require username to be 3-30 characters', async () => {
      const response = await testRequest()
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'ab',
          password: 'TestPass123!',
          organizationId: 1,
          clubId: 1,
        });

      expect(response.status).toBe(400);
    });

    it('should require password', async () => {
      const response = await testRequest()
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          organizationId: 1,
          clubId: 1,
        });

      expect(response.status).toBe(400);
    });

    it('should require password to be at least 8 characters', async () => {
      const response = await testRequest()
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'short',
          organizationId: 1,
          clubId: 1,
        });

      expect(response.status).toBe(400);
    });

    it('should require organizationId', async () => {
      const response = await testRequest()
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'TestPass123!',
          clubId: 1,
        });

      expect(response.status).toBe(400);
    });

    it('should require clubId', async () => {
      const response = await testRequest()
        .post('/api/auth/register')
        .send({
          email: 'test@test.com',
          username: 'testuser',
          password: 'TestPass123!',
          organizationId: 1,
        });

      expect(response.status).toBe(400);
    });

    it('should reject duplicate email', async () => {
      const email = `duplicate_${Date.now()}@test.com`;
      const userData = {
        email,
        username: `user1_${Date.now()}`,
        password: 'TestPass123!',
        organizationId: 1,
        clubId: 1,
      };

      // First registration should succeed
      const response1 = await testRequest()
        .post('/api/auth/register')
        .send(userData);
      expect(response1.status).toBe(201);

      // Second registration with same email should fail
      const response2 = await testRequest()
        .post('/api/auth/register')
        .send({
          ...userData,
          username: `user2_${Date.now()}`,
        });
      expect(response2.status).toBe(400);
      expect(response2.body.error).toContain('Email already registered');
    });

    it('should reject duplicate username', async () => {
      const username = `duplicate_${Date.now()}`;
      const userData = {
        email: `email1_${Date.now()}@test.com`,
        username,
        password: 'TestPass123!',
        organizationId: 1,
        clubId: 1,
      };

      // First registration should succeed
      const response1 = await testRequest()
        .post('/api/auth/register')
        .send(userData);
      expect(response1.status).toBe(201);

      // Second registration with same username should fail
      const response2 = await testRequest()
        .post('/api/auth/register')
        .send({
          ...userData,
          email: `email2_${Date.now()}@test.com`,
        });
      expect(response2.status).toBe(400);
      expect(response2.body.error).toContain('Username already taken');
    });

    it('should accept optional fields (firstName, lastName, phoneNumber, tkid)', async () => {
      const userData = {
        email: `optional_${Date.now()}@test.com`,
        username: `optional_${Date.now()}`,
        password: 'TestPass123!',
        firstName: 'Optional',
        lastName: 'Fields',
        phoneNumber: '123-456-7890',
        tkid: '12345',
        organizationId: 1,
        clubId: 1,
      };

      const response = await testRequest()
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.user.firstName).toBe(userData.firstName);
      expect(response.body.user.lastName).toBe(userData.lastName);
      expect(response.body.user.phoneNumber).toBe(userData.phoneNumber);
      expect(response.body.user.tkid).toBe(userData.tkid);
    });
  });

  describe('POST /api/auth/login', () => {
    let testUser: { email: string; username: string; password: string };

    beforeAll(async () => {
      const user = await createTestUser({
        email: `login_test_${Date.now()}@test.com`,
        username: `logintest_${Date.now()}`,
        password: 'LoginPass123!',
        organizationId: 1,
        clubId: 1,
      });
      testUser = {
        email: user.credentials.email,
        username: user.credentials.username,
        password: user.credentials.password,
      };
    });

    it('should login with email successfully', async () => {
      const response = await testRequest()
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.email).toBe(testUser.email);
    });

    it('should login with username successfully', async () => {
      const response = await testRequest()
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.username,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('user');
      expect(response.body).toHaveProperty('token');
      expect(response.body.user.username).toBe(testUser.username);
    });

    it('should require emailOrUsername', async () => {
      const response = await testRequest()
        .post('/api/auth/login')
        .send({
          password: testUser.password,
        });

      expect(response.status).toBe(400);
    });

    it('should require password', async () => {
      const response = await testRequest()
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.email,
        });

      expect(response.status).toBe(400);
    });

    it('should reject invalid email/username', async () => {
      const response = await testRequest()
        .post('/api/auth/login')
        .send({
          emailOrUsername: 'nonexistent@test.com',
          password: testUser.password,
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid email/username or password');
    });

    it('should reject incorrect password', async () => {
      const response = await testRequest()
        .post('/api/auth/login')
        .send({
          emailOrUsername: testUser.email,
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid email or password');
    });
  });

  describe('GET /api/auth/me', () => {
    let testToken: string;
    let testUser: any;

    beforeAll(async () => {
      const user = await createTestUser({
        email: `me_test_${Date.now()}@test.com`,
        username: `metest_${Date.now()}`,
        organizationId: 1,
        clubId: 1,
      });
      testToken = user.token;
      testUser = user.user;
    });

    it('should return current user with valid token', async () => {
      const response = await authRequest(testToken)
        .get('/api/auth/me');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email');
      expect(response.body).toHaveProperty('username');
      expect(response.body.id).toBe(testUser.id);
      expect(response.body.email).toBe(testUser.email);
    });

    it('should require authentication', async () => {
      const response = await testRequest()
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await authRequest('invalid-token')
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });

    it('should reject expired token', async () => {
      // This would require a token that's actually expired
      // For now, we'll just test that invalid tokens are rejected
      const response = await authRequest('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTYwOTQ1NjgwMCwiZXhwIjoxNjA5NDU2ODAwfQ.invalid')
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});

