const request = require('supertest');
const app = require('../../src/app');
const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const docClientMock = mockClient(DynamoDBDocumentClient);

describe('Movie API', () => {
  beforeEach(() => {
    docClientMock.reset();
  });

  describe('GET /api/movies', () => {
    it('should return 200 and an empty array initially', async () => {
      docClientMock.on(ScanCommand).resolves({ Items: [] });
      const response = await request(app).get('/api/movies');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/movies/:id', () => {
    it('should return 200 and the movie if found', async () => {
      docClientMock.on(GetCommand).resolves({ Item: { id: '123', title: 'Interstellar' } });
      const response = await request(app).get(`/api/movies/123`);
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('Interstellar');
    });

    it('should return 404 if movie not found', async () => {
      docClientMock.on(GetCommand).resolves({ Item: undefined });
      const response = await request(app).get('/api/movies/999');
      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/movies', () => {
    it('should return 201 and create a new movie', async () => {
      docClientMock.on(PutCommand).resolves({});
      const newMovie = { title: 'The Terminator', director: 'James Cameron', year: 1984 };
      const response = await request(app).post('/api/movies').send(newMovie);
      
      expect(response.status).toBe(201);
      expect(response.body.title).toBe('The Terminator');
    });
  });

  describe('PUT /api/movies/:id', () => {
    it('should return 200 and update the movie', async () => {
      docClientMock.on(GetCommand).resolves({ Item: { id: '123' } }); // Mock exists
      docClientMock.on(UpdateCommand).resolves({ Attributes: { id: '123', title: 'New Title', director: 'Director' } });
      
      const response = await request(app)
        .put(`/api/movies/123`)
        .send({ title: 'New Title' });
      
      expect(response.status).toBe(200);
      expect(response.body.title).toBe('New Title');
    });
  });

  describe('DELETE /api/movies/:id', () => {
    it('should return 204 and delete the movie', async () => {
      docClientMock.on(GetCommand).resolves({ Item: { id: '123' } });
      docClientMock.on(DeleteCommand).resolves({});
      const response = await request(app).delete(`/api/movies/123`);
      
      expect(response.status).toBe(204);
    });
  });
});
