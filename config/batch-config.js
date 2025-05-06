/**
 * Configuration for batch processing
 */
const batchConfig = {
  // Default batch size for processing applicants
  defaultBatchSize: 10,
  
  // Maximum number of concurrent operations
  maxConcurrency: 2,
  
  // Pause between batches in milliseconds
  pauseBetweenBatches: 2000,
  
  // Timeout for extraction operations in milliseconds (5 minutes)
  extractionTimeout: 300000,
  
  // Maximum retries for failed operations
  maxRetries: 3,
  
  // Delay between retries in milliseconds
  retryDelay: 5000
};

module.exports = batchConfig;