import { testRequest, closeDatabase } from './helpers';

describe('Health Check', () => {
  afterAll(async () => {
    await closeDatabase();
  });

  it('should return ok status', async () => {
    const response = await testRequest().get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(response.body.timestamp).toBeDefined();
  });
});
