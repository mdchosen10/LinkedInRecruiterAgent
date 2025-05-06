/**
 * Error handling utilities for LinkedIn Recruiter Agent
 * 
 * This module provides standardized error handling across the application.
 */

// Standard error codes
const ErrorCodes = {
  AUTH_ERROR: 'auth_error',
  NAVIGATION_ERROR: 'navigation_error',
  EXTRACTION_ERROR: 'extraction_error',
  DOWNLOAD_ERROR: 'download_error',
  ANALYSIS_ERROR: 'analysis_error',
  TIMEOUT_ERROR: 'timeout_error',
  DATABASE_ERROR: 'database_error',
  VALIDATION_ERROR: 'validation_error',
  NETWORK_ERROR: 'network_error',
  UNEXPECTED_ERROR: 'unexpected_error'
};

/**
 * Create a standardized error response object
 * @param {string} message - Error message
 * @param {string} code - Error code from ErrorCodes
 * @param {string} context - Additional context about the error
 * @param {Error} originalError - Original error object (optional)
 * @returns {Object} Standardized error response
 */
function createErrorResponse(message, code = ErrorCodes.UNEXPECTED_ERROR, context = null, originalError = null) {
  const response = {
    success: false,
    error: message,
    code: code
  };
  
  if (context) {
    response.context = context;
  }
  
  // Log the error with stack trace if available
  if (originalError) {
    console.error(`Error [${code}]: ${message}`, originalError);
    
    // Add stack trace in development mode only
    if (process.env.NODE_ENV === 'development') {
      response.stack = originalError.stack;
    }
  } else {
    console.error(`Error [${code}]: ${message}`);
  }
  
  return response;
}

/**
 * Create error handler for IPC methods
 * @param {string} methodName - Name of the method for context
 * @param {Function} handler - The handler function to wrap
 * @returns {Function} Wrapped handler with error handling
 */
function createIpcErrorHandler(methodName, handler) {
  return async (event, ...args) => {
    try {
      return await handler(event, ...args);
    } catch (error) {
      // Determine error code based on error type or message
      let errorCode = ErrorCodes.UNEXPECTED_ERROR;
      
      if (error.message.includes('authentication') || error.message.includes('login')) {
        errorCode = ErrorCodes.AUTH_ERROR;
      } else if (error.message.includes('navigation') || error.message.includes('page')) {
        errorCode = ErrorCodes.NAVIGATION_ERROR;
      } else if (error.message.includes('extract') || error.message.includes('applicant')) {
        errorCode = ErrorCodes.EXTRACTION_ERROR;
      } else if (error.message.includes('download') || error.message.includes('CV')) {
        errorCode = ErrorCodes.DOWNLOAD_ERROR;
      } else if (error.message.includes('analysis') || error.message.includes('evaluate')) {
        errorCode = ErrorCodes.ANALYSIS_ERROR;
      } else if (error.message.includes('timeout') || error.message.includes('timed out')) {
        errorCode = ErrorCodes.TIMEOUT_ERROR;
      } else if (error.message.includes('database') || error.message.includes('query')) {
        errorCode = ErrorCodes.DATABASE_ERROR;
      } else if (error.message.includes('validation') || error.message.includes('invalid')) {
        errorCode = ErrorCodes.VALIDATION_ERROR;
      } else if (error.message.includes('network') || error.message.includes('connection')) {
        errorCode = ErrorCodes.NETWORK_ERROR;
      }
      
      return createErrorResponse(
        error.message,
        errorCode,
        `Error in ${methodName}`,
        error
      );
    }
  };
}

/**
 * Handle errors in async functions with custom retry logic
 * @param {Function} operation - Async operation to execute with retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retry attempts
 * @param {number} options.retryDelay - Base delay between retries in ms
 * @param {Function} options.shouldRetry - Function to determine if retry should be attempted
 * @returns {Promise} - Result of the operation or throws after max retries
 */
async function withRetry(operation, options = {}) {
  const maxRetries = options.maxRetries || 3;
  const retryDelay = options.retryDelay || 1000;
  const shouldRetry = options.shouldRetry || (() => true);
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Skip retrying if shouldRetry returns false
      if (!shouldRetry(error, attempt)) {
        break;
      }
      
      // Log retry attempt
      console.warn(`Attempt ${attempt}/${maxRetries} failed: ${error.message}`);
      
      // Don't delay on the last attempt
      if (attempt < maxRetries) {
        // Exponential backoff with jitter
        const delay = retryDelay * Math.pow(1.5, attempt - 1) * (0.9 + Math.random() * 0.2);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

/**
 * Format errors for consistent UI display
 * @param {Error|Object|string} error - Error to format
 * @returns {Object} Formatted error for UI
 */
function formatErrorForUI(error) {
  // If already formatted error response
  if (error && typeof error === 'object' && 'success' in error && error.success === false) {
    return {
      message: error.error || 'An error occurred',
      code: error.code || ErrorCodes.UNEXPECTED_ERROR,
      context: error.context || null,
      technical: null
    };
  }
  
  // If error is Error object
  if (error instanceof Error) {
    return {
      message: getUiErrorMessage(error),
      code: getErrorCodeFromError(error),
      context: null,
      technical: process.env.NODE_ENV === 'development' ? error.stack : null
    };
  }
  
  // If error is string
  if (typeof error === 'string') {
    return {
      message: error,
      code: ErrorCodes.UNEXPECTED_ERROR,
      context: null,
      technical: null
    };
  }
  
  // Default case
  return {
    message: 'An unexpected error occurred',
    code: ErrorCodes.UNEXPECTED_ERROR,
    context: null,
    technical: null
  };
}

/**
 * Get user-friendly error message based on error type
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
function getUiErrorMessage(error) {
  // Extract code or determine from error message
  const code = getErrorCodeFromError(error);
  
  // Return user-friendly message based on code
  switch (code) {
    case ErrorCodes.AUTH_ERROR:
      return 'Authentication failed. Please check your credentials and try again.';
    case ErrorCodes.NAVIGATION_ERROR:
      return 'Navigation error. LinkedIn page may have changed structure.';
    case ErrorCodes.EXTRACTION_ERROR:
      return 'Failed to extract applicant data. Please try again.';
    case ErrorCodes.DOWNLOAD_ERROR:
      return 'Failed to download CV. The file may not be available.';
    case ErrorCodes.ANALYSIS_ERROR:
      return 'CV analysis failed. Please check the file format and try again.';
    case ErrorCodes.TIMEOUT_ERROR:
      return 'Operation timed out. Please try again or reduce batch size.';
    case ErrorCodes.DATABASE_ERROR:
      return 'Database operation failed. Please check your connection.';
    case ErrorCodes.VALIDATION_ERROR:
      return 'Invalid input. Please check your data and try again.';
    case ErrorCodes.NETWORK_ERROR:
      return 'Network connection error. Please check your internet connection.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
}

/**
 * Extract error code from Error object
 * @param {Error} error - The error object
 * @returns {string} Error code
 */
function getErrorCodeFromError(error) {
  // Try to extract code from error if it exists
  if (error.code) {
    return error.code;
  }
  
  // Determine from error message
  const message = error.message || '';
  
  if (message.includes('authentication') || message.includes('login')) {
    return ErrorCodes.AUTH_ERROR;
  } else if (message.includes('navigation') || message.includes('page')) {
    return ErrorCodes.NAVIGATION_ERROR;
  } else if (message.includes('extract') || message.includes('applicant')) {
    return ErrorCodes.EXTRACTION_ERROR;
  } else if (message.includes('download') || message.includes('CV')) {
    return ErrorCodes.DOWNLOAD_ERROR;
  } else if (message.includes('analysis') || message.includes('evaluate')) {
    return ErrorCodes.ANALYSIS_ERROR;
  } else if (message.includes('timeout') || message.includes('timed out')) {
    return ErrorCodes.TIMEOUT_ERROR;
  } else if (message.includes('database') || message.includes('query')) {
    return ErrorCodes.DATABASE_ERROR;
  } else if (message.includes('validation') || message.includes('invalid')) {
    return ErrorCodes.VALIDATION_ERROR;
  } else if (message.includes('network') || message.includes('connection')) {
    return ErrorCodes.NETWORK_ERROR;
  }
  
  return ErrorCodes.UNEXPECTED_ERROR;
}

module.exports = {
  ErrorCodes,
  createErrorResponse,
  createIpcErrorHandler,
  withRetry,
  formatErrorForUI
};