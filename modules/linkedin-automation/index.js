/**
 * LinkedIn Automation Module - Index
 * 
 * This module provides access to both the original and enhanced LinkedIn automation
 * capabilities for the LinkedIn Recruiter Agent.
 */

const LinkedInAutomation = require('./linkedin-automation');
const EnhancedLinkedInAutomation = require('./src/enhanced-linkedin-automation');
const EventStandardization = require('./src/event-standardization');
const integrationTests = require('./src/integration-test');

module.exports = {
  // Original implementation (for backward compatibility)
  LinkedInAutomation,
  
  // Enhanced implementation with extraction progress events and batch processing
  EnhancedLinkedInAutomation,
  
  // Event standardization utility
  EventStandardization,
  
  // Integration tests
  integrationTests,
  
  // Default export is the enhanced version
  default: EnhancedLinkedInAutomation
};