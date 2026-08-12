const { mockClient } = require('aws-sdk-client-mock');
const { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');
const MovieModelClass = require('../../src/models/MovieModel');
const MovieModel = MovieModelClass;
const docClientMock = mockClient(DynamoDBDocumentClient);

describe('MovieModel', () => {
  beforeEach(() => {
    docClientMock.reset();
  });

  test('should return empty list', async () => {
    docClientMock.on(ScanCommand).resolves({ Items: [] });
    const movies = await MovieModel.getAll();
    expect(movies).toEqual([]);
  });

  test('should create a new movie', async () => {
    docClientMock.on(PutCommand).resolves({});
    const movieData = { title: 'The Matrix', director: 'Wachowskis', year: 1999 };
    const movie = await MovieModel.create(movieData);

    expect(movie).toHaveProperty('id');
    expect(movie).toHaveProperty('title', 'The Matrix');
  });

  test('should get a movie by id', async () => {
    const fakeMovie = { id: '123', title: 'Inception' };
    docClientMock.on(GetCommand).resolves({ Item: fakeMovie });
    const fetchedMovie = await MovieModel.getById('123');

    expect(fetchedMovie).toEqual(fakeMovie);
  });

  test('should return undefined for a non-existent id', async () => {
    docClientMock.on(GetCommand).resolves({ Item: undefined });
    const fetchedMovie = await MovieModel.getById('999');
    expect(fetchedMovie).toBeUndefined();
  });

  test('should update an existing movie', async () => {
    docClientMock.on(GetCommand).resolves({ Item: { id: '123', title: 'Avatar' } });
    docClientMock.on(UpdateCommand).resolves({ Attributes: { id: '123', title: 'Avatar: The Way of Water' } });
    
    const updatedMovie = await MovieModel.updateWithCondition('123', { title: 'Avatar: The Way of Water' });

    expect(updatedMovie).toHaveProperty('title', 'Avatar: The Way of Water');
  });

  test('should delete an existing movie', async () => {
    docClientMock.on(GetCommand).resolves({ Item: { id: '123' } });
    docClientMock.on(DeleteCommand).resolves({});
    
    const success = await MovieModel.delete('123');
    expect(success).toBe(true);
  });
});
