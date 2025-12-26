import request from 'supertest';
import app from '../app';
import pool from '../config/database';

// Export supertest agent for making requests
export const testRequest = () => request(app);

// Helper to clean up test data
// Only deletes test users and their related data, preserves seeded troops
export const cleanupTestData = async () => {
  // Get test user IDs (users with @test.com emails)
  const testUsers = await pool.query(
    'SELECT id FROM users WHERE email LIKE $1',
    ['%@test.com'],
  );
  const testUserIds = testUsers.rows.map(row => row.id);

  if (testUserIds.length > 0) {
    // Delete attendance records for test users only
    await pool.query(
      'DELETE FROM troop_attendees WHERE user_id = ANY($1)',
      [testUserIds],
    );

    // Delete club memberships for test users only
    await pool.query(
      'DELETE FROM club_members WHERE user_id = ANY($1)',
      [testUserIds],
    );

    // Delete troops created by test users only
    const testTroops = await pool.query(
      'SELECT id FROM troops WHERE created_by = ANY($1)',
      [testUserIds],
    );
    const testTroopIds = testTroops.rows.map(row => row.id);

    if (testTroopIds.length > 0) {
      await pool.query(
        'DELETE FROM troop_clubs WHERE troop_id = ANY($1)',
        [testTroopIds],
      );
      await pool.query(
        'DELETE FROM troops WHERE id = ANY($1)',
        [testTroopIds],
      );
    }

    // Delete test users
    await pool.query(
      'DELETE FROM users WHERE id = ANY($1)',
      [testUserIds],
    );
  }
};

// Type for createTestUser options
export interface CreateTestUserOptions {
  email?: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  organizationId?: number;
  clubId?: number;
  isAdmin?: boolean;
}

// Type for createTestUser return value
export interface TestUserResult {
  user: any;
  token: string;
  userId: number;
  credentials: {
    email: string;
    username: string;
    password: string;
    firstName: string;
    lastName: string;
    organizationId: number;
    clubId: number;
  };
}

// Helper to create a test user and get auth token
export const createTestUser = async (userData?: CreateTestUserOptions): Promise<TestUserResult> => {
  const { isAdmin, ...registrationData } = userData || {};

  const defaultData = {
    email: `test${Date.now()}@test.com`,
    username: `testuser${Date.now()}`,
    password: 'TestPass123!',
    firstName: 'Test',
    lastName: 'User',
    organizationId: 1,
    clubId: 1,
    ...registrationData,
  };

  const response = await testRequest()
    .post('/api/auth/register')
    .send(defaultData);

  if (response.status !== 201) {
    throw new Error(`Failed to create test user: ${JSON.stringify(response.body)}`);
  }

  const userId = response.body.user?.id;
  if (!userId) {
    throw new Error('User ID not found in registration response');
  }

  const clubId = defaultData.clubId;

  // If isAdmin is true, update the user's role to admin
  if (isAdmin && userId && clubId) {
    await pool.query(
      'UPDATE club_members SET role = \'admin\' WHERE user_id = $1 AND club_id = $2',
      [userId, clubId],
    );
  }

  return {
    user: response.body.user,
    token: response.body.token,
    userId,
    credentials: defaultData,
  };
};

// Helper to make authenticated requests
export const authRequest = (token: string) => ({
  get: (url: string) => testRequest().get(url).set('Authorization', `Bearer ${token}`),
  post: (url: string) => testRequest().post(url).set('Authorization', `Bearer ${token}`),
  put: (url: string) => testRequest().put(url).set('Authorization', `Bearer ${token}`),
  delete: (url: string) => testRequest().delete(url).set('Authorization', `Bearer ${token}`),
});

// Close database connection after all tests
export const closeDatabase = async () => {
  await pool.end();
};
