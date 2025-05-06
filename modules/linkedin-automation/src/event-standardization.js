/**
 * LinkedIn Automation - Event Standardization Layer
 * 
 * This module maps internal LinkedInAutomation events to standardized events
 * that conform to the API Contract specification. It ensures all events
 * include the required data fields in the correct format.
 */

class EventStandardization {
  /**
   * Creates a new EventStandardization instance
   * @param {EventEmitter} emitter - The event emitter to wrap
   */
  constructor(emitter) {
    this.emitter = emitter;
  }

  /**
   * Emit an extraction started event
   * @param {Object} data - Event data containing jobId and estimated total
   */
  emitExtractionStarted(data) {
    const standardizedEvent = {
      jobId: data.jobId,
      estimatedTotal: data.estimatedApplicants || 0,
      timestamp: Date.now()
    };
    
    this.emitter.emit('extraction-started', standardizedEvent);
  }

  /**
   * Emit an extraction progress event
   * @param {Object} data - Progress data
   */
  emitExtractionProgress(data) {
    const standardizedEvent = {
      current: data.current || 0,
      total: data.total || 0,
      percentage: data.percentage || 0,
      currentApplicant: data.currentApplicant || null,
      timestamp: Date.now()
    };
    
    this.emitter.emit('extraction-progress', standardizedEvent);
  }

  /**
   * Emit an extraction paused event
   * @param {Object} data - Pause data
   */
  emitExtractionPaused(data) {
    const standardizedEvent = {
      current: data.current || 0,
      total: data.total || 0,
      percentage: Math.round(((data.current || 0) / (data.total || 1)) * 100),
      timestamp: Date.now(),
      pauseReason: data.reason || 'user_requested'
    };
    
    this.emitter.emit('extraction-paused', standardizedEvent);
  }

  /**
   * Emit an extraction resumed event
   * @param {Object} data - Resume data
   */
  emitExtractionResumed(data) {
    const standardizedEvent = {
      current: data.current || 0,
      total: data.total || 0,
      percentage: Math.round(((data.current || 0) / (data.total || 1)) * 100),
      timestamp: Date.now()
    };
    
    this.emitter.emit('extraction-resumed', standardizedEvent);
  }

  /**
   * Emit an extraction completed event
   * @param {Object} data - Completion data
   */
  emitExtractionCompleted(data) {
    const standardizedEvent = {
      applicants: data.applicants || [],
      total: (data.applicants || []).length,
      timestamp: Date.now(),
      completionTime: data.completionTime || null
    };
    
    this.emitter.emit('extraction-completed', standardizedEvent);
  }

  /**
   * Emit an extraction error event
   * @param {Object} data - Error data
   */
  emitExtractionError(data) {
    const errorCode = this._mapErrorToCode(data.error);
    
    const standardizedEvent = {
      error: data.error || 'Unknown error',
      errorCode: errorCode,
      context: data.context || '',
      timestamp: Date.now(),
      recoverable: data.recoverable || false,
      partial: data.partial || null
    };
    
    this.emitter.emit('extraction-error', standardizedEvent);
  }

  /**
   * Emit a CV download started event
   * @param {Object} data - Download start data
   */
  emitCVDownloadStarted(data) {
    const standardizedEvent = {
      profileId: data.profileId || '',
      profileName: data.profileName || '',
      timestamp: Date.now()
    };
    
    this.emitter.emit('cv-download-started', standardizedEvent);
  }

  /**
   * Emit a CV download progress event
   * @param {Object} data - Download progress data
   */
  emitCVDownloadProgress(data) {
    const standardizedEvent = {
      profileId: data.profileId || '',
      profileName: data.profileName || '',
      percentage: data.percentage || 0,
      timestamp: Date.now()
    };
    
    this.emitter.emit('cv-download-progress', standardizedEvent);
  }

  /**
   * Emit a CV download completed event
   * @param {Object} data - Download completion data
   */
  emitCVDownloadCompleted(data) {
    const standardizedEvent = {
      profileId: data.profileId || '',
      profileName: data.profileName || '',
      filePath: data.filePath || null,
      fileSize: data.fileSize || 0,
      timestamp: Date.now()
    };
    
    this.emitter.emit('cv-download-completed', standardizedEvent);
  }

  /**
   * Emit a CV download error event
   * @param {Object} data - Download error data
   */
  emitCVDownloadError(data) {
    const errorCode = this._mapErrorToCode(data.error);
    
    const standardizedEvent = {
      profileId: data.profileId || '',
      profileName: data.profileName || '',
      error: data.error || 'Unknown error',
      errorCode: errorCode,
      timestamp: Date.now()
    };
    
    this.emitter.emit('cv-download-error', standardizedEvent);
  }

  /**
   * Emit a batch processing started event
   * @param {Object} data - Batch start data
   */
  emitBatchStarted(data) {
    const standardizedEvent = {
      batchId: data.batchId || Date.now().toString(),
      batchSize: data.batchSize || 0,
      totalBatches: data.totalBatches || 0,
      currentBatch: data.currentBatch || 0,
      timestamp: Date.now()
    };
    
    this.emitter.emit('batch-started', standardizedEvent);
  }

  /**
   * Emit a batch completed event
   * @param {Object} data - Batch completion data
   */
  emitBatchCompleted(data) {
    const standardizedEvent = {
      batchId: data.batchId || Date.now().toString(),
      processedItems: data.processedItems || 0,
      successfulItems: data.successfulItems || 0,
      failedItems: data.failedItems || 0,
      totalBatches: data.totalBatches || 0,
      currentBatch: data.currentBatch || 0,
      timestamp: Date.now()
    };
    
    this.emitter.emit('batch-completed', standardizedEvent);
  }

  /**
   * Map error messages to standardized error codes
   * @param {string} errorMessage - The error message
   * @returns {string} - Standardized error code
   * @private
   */
  _mapErrorToCode(errorMessage) {
    if (!errorMessage) return 'UNKNOWN_ERROR';
    
    const errorStr = String(errorMessage).toLowerCase();
    
    if (errorStr.includes('login') || errorStr.includes('auth')) {
      return 'AUTH_ERROR';
    }
    
    if (errorStr.includes('navigation') || errorStr.includes('page') || errorStr.includes('load')) {
      return 'NAVIGATION_ERROR';
    }
    
    if (errorStr.includes('timeout') || errorStr.includes('timed out')) {
      return 'TIMEOUT_ERROR';
    }
    
    if (errorStr.includes('rate') || errorStr.includes('limit')) {
      return 'RATE_LIMIT_ERROR';
    }
    
    if (errorStr.includes('captcha') || errorStr.includes('security') || errorStr.includes('verification')) {
      return 'SECURITY_CHECK_ERROR';
    }
    
    if (errorStr.includes('download') || errorStr.includes('file')) {
      return 'DOWNLOAD_ERROR';
    }
    
    if (errorStr.includes('parsing') || errorStr.includes('extract')) {
      return 'PARSING_ERROR';
    }
    
    return 'GENERAL_ERROR';
  }
}

module.exports = EventStandardization;