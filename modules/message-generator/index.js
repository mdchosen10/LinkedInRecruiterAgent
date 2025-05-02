/**
 * Entry point for the recruiting message generator module
 * This file exports the core functionality and serves as the main entry point
 */

const MessageGenerator = require('./message-generator');
const MessageGeneratorAPI = require('./message-generator-api');

// Export the main classes
module.exports = {
  MessageGenerator,
  MessageGeneratorAPI,
  
  /**
   * Create a new instance of MessageGenerator with default options
   * @param {Object} options - Configuration options
   * @returns {MessageGenerator} New MessageGenerator instance
   */
  createMessageGenerator: (options = {}) => new MessageGenerator(options),
  
  /**
   * Create a new instance of MessageGeneratorAPI with default options
   * @param {Object} options - Configuration options
   * @returns {MessageGeneratorAPI} New MessageGeneratorAPI instance
   */
  createAPI: (options = {}) => new MessageGeneratorAPI(options)
};

// If this file is run directly, start the API server
if (require.main === module) {
  const dotenv = require('dotenv');
  const express = require('express');
  const bodyParser = require('body-parser');
  
  // Load environment variables
  dotenv.config();
  
  const app = express();
  app.use(bodyParser.json());
  
  // Create API instance
  const messageGeneratorAPI = new MessageGeneratorAPI({
    templatesDir: process.env.TEMPLATES_DIR || './templates'
  });
  
  // Set up routes
  require('./routes/api')(app, messageGeneratorAPI);
  
  // Start the server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Message Generator API running on port ${PORT}`);
    console.log(`Templates directory: ${messageGeneratorAPI.templatesDir}`);
  });
}