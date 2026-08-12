const serverless = require('serverless-http');
const app = require('./app');

// Encapsula o aplicativo Express para rodar dentro da AWS Lambda
module.exports.handler = serverless(app);
