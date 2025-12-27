import { testRequest, cleanupTestData, closeDatabase } from './helpers';

describe('Organizations API', () => {
  afterAll(async () => {
    await cleanupTestData();
    await closeDatabase();
  });

  describe('GET /api/organizations', () => {
    it('should return all organizations', async () => {
      const response = await testRequest()
        .get('/api/organizations');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);

      // Check structure of first organization
      if (response.body.length > 0) {
        const org = response.body[0];
        expect(org).toHaveProperty('id');
        expect(org).toHaveProperty('name');
        expect(org).toHaveProperty('description');
      }
    });

    it('should return organizations with all required fields', async () => {
      const response = await testRequest()
        .get('/api/organizations');

      expect(response.status).toBe(200);

      if (response.body.length > 0) {
        const org = response.body[0];
        expect(org).toHaveProperty('id');
        expect(org).toHaveProperty('name');
        expect(org).toHaveProperty('description');
        expect(org).toHaveProperty('created_at');
        expect(org).toHaveProperty('updated_at');

        // Type checks
        expect(typeof org.id).toBe('number');
        expect(typeof org.name).toBe('string');
      }
    });

    it('should include seed data organizations', async () => {
      const response = await testRequest()
        .get('/api/organizations');

      expect(response.status).toBe(200);

      const orgNames = response.body.map((org: any) => org.name);

      // Check for expected seed data organizations
      // These should exist from the seed migration
      const expectedOrgs = [
        '501st Legion',
        'Rebel Legion',
        'Mandalorian Mercs',
        'Droid Builders',
        'Jedi Sith Alliance',
      ];

      // At least some of these should be present
      const foundOrgs = expectedOrgs.filter(name => orgNames.includes(name));
      expect(foundOrgs.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/organizations/:id', () => {
    let testOrgId: number;

    beforeAll(async () => {
      // Get an organization ID from the list
      const orgsResponse = await testRequest()
        .get('/api/organizations');

      if (orgsResponse.body.length > 0) {
        testOrgId = orgsResponse.body[0].id;
      } else {
        // Fallback: use ID 1 (from seed data)
        testOrgId = 1;
      }
    });

    it('should return organization by ID', async () => {
      const response = await testRequest()
        .get(`/api/organizations/${testOrgId}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('description');
      expect(response.body.id).toBe(testOrgId);
    });

    it('should return 404 for non-existent organization', async () => {
      const response = await testRequest()
        .get('/api/organizations/99999');

      expect(response.status).toBe(404);
      expect(response.body.error).toContain('Organization not found');
    });

    it('should return 400 for invalid organization ID', async () => {
      const response = await testRequest()
        .get('/api/organizations/invalid');

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid organization ID');
    });

    it('should return 400 for negative organization ID', async () => {
      const response = await testRequest()
        .get('/api/organizations/-1');

      expect(response.status).toBe(400);
    });

    it('should return 400 for zero organization ID', async () => {
      const response = await testRequest()
        .get('/api/organizations/0');

      expect(response.status).toBe(400);
    });
  });

  describe('Organization data structure', () => {
    it('should return organizations with consistent structure', async () => {
      const response = await testRequest()
        .get('/api/organizations');

      expect(response.status).toBe(200);

      if (response.body.length > 0) {
        // Check that all organizations have the same structure
        response.body.forEach((org: any) => {
          expect(org).toHaveProperty('id');
          expect(org).toHaveProperty('name');
          expect(org).toHaveProperty('description');
          expect(org).toHaveProperty('created_at');
          expect(org).toHaveProperty('updated_at');

          // Ensure required fields are not null
          expect(org.id).not.toBeNull();
          expect(org.name).not.toBeNull();
        });
      }
    });
  });
});



