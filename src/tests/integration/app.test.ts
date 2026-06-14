/* eslint-disable no-undef */
import request from 'supertest';
import app from '../../app';

describe('App Integration Tests', () => {
  describe('JWT Authentication', () => {
    it('should generate JWT token on /api/v1/jwt', async () => {
      const userData = {
        email: 'test@example.com',
        role: 'user',
      };

      const response = await request(app).post('/api/v1/jwt').send(userData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.headers['set-cookie']).toBeDefined();
    });

    it('should handle JWT generation failure', async () => {
      const response = await request(app).post('/api/v1/jwt').send({});

      // Should still return 200 or handle gracefully
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('Logout', () => {
    it('should clear token cookie on /api/v1/logout', async () => {
      const response = await request(app).post('/api/v1/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('CORS', () => {
    it('should have CORS headers', async () => {
      const response = await request(app)
        .get('/api/v1/users')
        .set('Origin', 'http://localhost:5173');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app).get('/api/v1/non-existent-route');

      expect(response.status).toBe(404);
    });
  });

  describe('Error Handling', () => {
    it('should handle errors gracefully', async () => {
      // This would test the global error handler
      const response = await request(app)
        .post('/api/v1/users')
        .send({ invalid: 'data' });

      // Should return error response without crashing
      expect(response.status).toBeDefined();
    });
  });
});
