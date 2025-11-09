import request from 'supertest';
import app from '../src/server.js';

describe('API Endpoints', () => {
  // Clean up after all tests
  afterAll((done) => {
    // Force Jest to exit by closing any open handles
    setTimeout(() => {
      done();
    }, 500);
  });

  describe('GET /', () => {
    it('should return API information', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('GitLab Chatbot API');
    });
  });

  describe('GET /api/chat/health', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/api/chat/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('healthy');
    });
  });

  describe('POST /api/chat/query', () => {
    it('should validate required fields', async () => {
      const res = await request(app)
        .post('/api/chat/query')
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid query format', async () => {
      const res = await request(app)
        .post('/api/chat/query')
        .send({ query: '' });
      
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/chat/stats', () => {
    it('should return system statistics', async () => {
      const res = await request(app).get('/api/chat/stats');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
    });
  });
});
