const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { 
  DynamoDBDocumentClient, 
  ScanCommand, 
  GetCommand, 
  PutCommand, 
  UpdateCommand, 
  DeleteCommand 
} = require('@aws-sdk/lib-dynamodb');
const crypto = require('crypto');

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:4566'
});

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'Movies';

class MovieModel {
  async getAll() {
    const command = new ScanCommand({
      TableName: TABLE_NAME,
    });
    const response = await docClient.send(command);
    return response.Items || [];
  }

  async getById(id) {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });
    const response = await docClient.send(command);
    return response.Item;
  }

  async create(movieData) {
    const newMovie = {
      id: crypto.randomUUID(),
      title: movieData.title,
      director: movieData.director,
      year: movieData.year
    };

    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: newMovie,
    });
    await docClient.send(command);
    return newMovie;
  }

  async update(id, movieData) {
    // We build the update expression dynamically based on provided fields
    let updateExpression = 'set';
    const expressionAttributeNames = {};
    const expressionAttributeValues = {};
    
    if (movieData.title !== undefined) {
      updateExpression += ' #t = :t,';
      expressionAttributeNames['#t'] = 'title';
      expressionAttributeValues[':t'] = movieData.title;
    }
    if (movieData.director !== undefined) {
      updateExpression += ' #d = :d,';
      expressionAttributeNames['#d'] = 'director';
      expressionAttributeValues[':d'] = movieData.director;
    }
    if (movieData.year !== undefined) {
      updateExpression += ' #y = :y,';
      expressionAttributeNames['#y'] = 'year';
      expressionAttributeValues[':y'] = movieData.year;
    }

    // Remove trailing comma
    updateExpression = updateExpression.slice(0, -1);

    // If no fields to update, just return the existing item
    if (Object.keys(expressionAttributeValues).length === 0) {
      return this.getById(id);
    }

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW',
    });

    try {
      const response = await docClient.send(command);
      return response.Attributes;
    } catch (error) {
      if (error.name === 'ResourceNotFoundException' || error.name === 'ValidationException') {
        // ValidationException often thrown if item doesn't exist depending on condition expression
        // But without ConditionExpression, UpdateItem will CREATE the item if it doesn't exist.
        // We should ideally check if it exists first or add a ConditionExpression.
      }
      throw error;
    }
  }

  async updateWithCondition(id, movieData) {
      // Safer update: only update if item exists
      const existing = await this.getById(id);
      if (!existing) return null;

      return this.update(id, movieData);
  }

  async delete(id) {
    // Check if exists first since DeleteItem doesn't tell us if it deleted something unless we ask for return values
    const existing = await this.getById(id);
    if (!existing) return false;

    const command = new DeleteCommand({
      TableName: TABLE_NAME,
      Key: { id },
    });
    
    await docClient.send(command);
    return true;
  }
}

// Export the class for testing (so we can mock docClient if needed) or an instance
module.exports = new MovieModel();
module.exports.docClient = docClient; // Expose for mocking in tests
