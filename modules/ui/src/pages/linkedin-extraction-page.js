import React, { useState, useEffect } from 'react';
import { GlobeAltIcon } from '@heroicons/react/24/outline';

// Import custom components
import JobSelector from '../components/linkedin/job-selector';
import ExtractionProgress from '../components/linkedin/extraction-progress';
import ApplicantList from '../components/linkedin/applicant-list';

/**
 * Page component for LinkedIn data extraction
 */
const LinkedInExtractionPage = () => {
  // State variables
  const [status, setStatus] = useState('idle'); // idle, connecting, extracting, completed, error
  const [jobUrls, setJobUrls] = useState([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [applicants, setApplicants] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Register event listeners for extraction progress
  useEffect(() => {
    if (!window.api) {
      console.error('Electron API is not available!');
      return () => {};
    }

    // Define event handlers
    const handleExtractionStarted = () => {
      setStatus('extracting');
      setProgress({ current: 0, total: 0 });
      setError(null);
    };

    const handleExtractionProgress = (event, data) => {
      setProgress(data);
    };

    const handleExtractionCompleted = (event, data) => {
      setStatus('completed');
      setApplicants(data.applicants || []);
    };

    const handleExtractionError = (event, error) => {
      setStatus('error');
      setError(error.message || 'Unknown extraction error');
    };

    // Register event listeners
    window.api.on('extraction-started', handleExtractionStarted);
    window.api.on('extraction-progress', handleExtractionProgress);
    window.api.on('extraction-completed', handleExtractionCompleted);
    window.api.on('extraction-error', handleExtractionError);

    // Cleanup function to remove event listeners
    return () => {
      window.api.off('extraction-started', handleExtractionStarted);
      window.api.off('extraction-progress', handleExtractionProgress);
      window.api.off('extraction-completed', handleExtractionCompleted);
      window.api.off('extraction-error', handleExtractionError);
    };
  }, []);

  /**
   * Start LinkedIn browser
   */
  const startLinkedInBrowser = async (e) => {
    // Prevent default form submission behavior
    if (e) e.preventDefault();
    
    console.log('startLinkedInBrowser called');
    
    if (!window.api) {
      console.error('Electron API is not available');
      setError('Electron API is not available');
      return;
    }

    try {
      setStatus('connecting');
      setError(null);
      
      console.log('Calling window.api.startLinkedInBrowser...');
      // Call the API to start LinkedIn browser
      const result = await window.api.startLinkedInBrowser();
      console.log('startLinkedInBrowser result:', result);
      
      // Note: The browser starting status will be updated via events
    } catch (err) {
      console.error('Error starting LinkedIn browser:', err);
      setStatus('error');
      setError(err.message || 'Failed to start LinkedIn browser');
    }
  };

  /**
   * Start the extraction process
   */
  const startExtraction = async (e) => {
    // Prevent default form submission behavior
    if (e) e.preventDefault();
    
    console.log('startExtraction called');
    
    if (!window.api) {
      console.error('Electron API is not available');
      setError('Electron API is not available');
      return;
    }

    // Validate that we have job URLs
    if (jobUrls.length === 0) {
      setError('Please add at least one LinkedIn job URL before starting extraction');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Calling startLinkedInBrowser with jobUrls:', jobUrls);
      
      // Call the API to start browser for extraction
      const result = await window.api.startLinkedInBrowser({ jobUrls });
      console.log('Extraction result:', result);
      
      // Note: Extraction progress will be updated via events
    } catch (err) {
      console.error('Error starting extraction:', err);
      setStatus('error');
      setError(err.message || 'Failed to start extraction');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Retry extraction after an error
   */
  const retryExtraction = async () => {
    // Reset states
    setStatus('idle');
    setError(null);
    setProgress({ current: 0, total: 0 });
  };

  /**
   * Import all applicants
   */
  const importAllApplicants = async () => {
    if (!window.api || applicants.length === 0) return;
    
    try {
      setLoading(true);
      await window.api.importApplicants(applicants);
      // Update status of applicants
      setApplicants(applicants.map(a => ({ ...a, status: 'imported' })));
    } catch (err) {
      setError(`Failed to import applicants: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Import selected applicants
   */
  const importSelectedApplicants = async (selectedApplicants) => {
    if (!window.api || selectedApplicants.length === 0) return;
    
    try {
      setLoading(true);
      await window.api.importApplicants(selectedApplicants);
      
      // Update status of imported applicants
      const updatedApplicants = applicants.map(applicant => {
        const isSelected = selectedApplicants.some(a => a.id === applicant.id);
        return isSelected ? { ...applicant, status: 'imported' } : applicant;
      });
      
      setApplicants(updatedApplicants);
    } catch (err) {
      setError(`Failed to import selected applicants: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Check if extraction can be started
  const canStartExtraction = status === 'idle' && jobUrls.length > 0 && !loading;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">LinkedIn Extraction</h1>
          <p className="mt-1 text-sm text-gray-500">
            Extract applicant data from LinkedIn job postings
          </p>
        </div>
        <div>
          <button
            id="startLinkedInBrowserButton"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Start LinkedIn Browser button clicked');
              
              // Use the robust API
              if (window.api && window.api.startLinkedInBrowser) {
                try {
                  console.log('Setting status to connecting...');
                  setStatus('connecting');
                  setError(null);
                  
                  console.log('Calling startLinkedInBrowser API method...');
                  window.api.startLinkedInBrowser()
                    .then(result => {
                      console.log('LinkedIn browser start result:', result);
                      // Success handling will be through events
                    })
                    .catch(err => {
                      console.error('LinkedIn browser error:', err);
                      setStatus('error');
                      setError(err.message || 'Failed to start LinkedIn browser');
                    });
                } catch (error) {
                  console.error('Exception calling startLinkedInBrowser:', error);
                  setStatus('error');
                  setError('Failed to start LinkedIn browser: ' + error.message);
                }
              } else {
                console.warn('API not available, using fallback handler');
                // Fallback to handler if API not directly available
                startLinkedInBrowser(e);
              }
            }}
            disabled={status === 'connecting' || status === 'extracting' || loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
          >
            <GlobeAltIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Open LinkedIn Browser
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Job selector and controls */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Job URLs</h2>
            
            <JobSelector
              jobUrls={jobUrls}
              onChange={setJobUrls}
              disabled={status === 'connecting' || status === 'extracting' || loading}
            />
            
            <div className="mt-6">
              <button
                id="startExtractionButton"
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Start Extraction button clicked');
                  
                  // Validate that we have job URLs
                  if (jobUrls.length === 0) {
                    setError('Please add at least one LinkedIn job URL before starting extraction');
                    return;
                  }
                  
                  // Use the robust API
                  if (window.api && window.api.startLinkedInBrowser) {
                    try {
                      console.log('Setting loading state...');
                      setLoading(true);
                      setError(null);
                      
                      // Parse job URL for ID and applicant view ID if available
                      const jobId = jobUrls[0].match(/\/hiring\/jobs\/(\d+)/) ? 
                        jobUrls[0].match(/\/hiring\/jobs\/(\d+)/)[1] : null;
                      
                      const applicantViewId = jobUrls[0].match(/\/applicants\/(\d+)/) ?
                        jobUrls[0].match(/\/applicants\/(\d+)/)[1] : null;
                      
                      const extractionOptions = { 
                        jobUrls,
                        jobId,
                        applicantViewId
                      };
                      
                      console.log('Starting extraction with options:', extractionOptions);
                      window.api.startLinkedInBrowser(extractionOptions)
                        .then(result => {
                          console.log('Extraction start result:', result);
                          // Success handling will be through events
                        })
                        .catch(err => {
                          console.error('Extraction error:', err);
                          setStatus('error');
                          setError(err.message || 'Failed to start extraction');
                        })
                        .finally(() => {
                          setLoading(false);
                        });
                    } catch (error) {
                      console.error('Exception starting extraction:', error);
                      setStatus('error');
                      setError('Failed to start extraction: ' + error.message);
                      setLoading(false);
                    }
                  } else {
                    console.warn('API not available, using fallback handler');
                    // Fallback to normal handler
                    startExtraction(e);
                  }
                }}
                disabled={!canStartExtraction}
                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
              >
                Start Extraction
              </button>
            </div>
          </div>

          <ExtractionProgress
            status={status}
            progress={progress}
            error={error}
            onRetry={retryExtraction}
          />
        </div>
        
        {/* Right column - Applicant list */}
        <div className="lg:col-span-2">
          <ApplicantList
            applicants={applicants}
            loading={loading}
            onImportAll={importAllApplicants}
            onImportSelected={importSelectedApplicants}
          />
        </div>
      </div>
    </div>
  );
};

export default LinkedInExtractionPage;