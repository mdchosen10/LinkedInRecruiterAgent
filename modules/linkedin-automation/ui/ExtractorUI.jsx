/**
 * LinkedIn Applicant Extractor UI Component
 * 
 * This React component demonstrates how to interact with the enhanced
 * LinkedIn Automation module through IPC in an Electron application.
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

// Electron IPC renderer - this should be exposed via preload script
const { ipcRenderer } = window.electron || {};

const ExtractorUI = ({ jobId }) => {
  // State for extraction process
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
    currentApplicant: null
  });
  const [applicants, setApplicants] = useState([]);
  const [error, setError] = useState(null);
  const [operationState, setOperationState] = useState(null);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0
  });
  
  // Options for extraction
  const [options, setOptions] = useState({
    batchSize: 5,
    maxApplicants: 100,
    pauseBetweenBatches: 3000,
    getDetailedProfiles: false,
    downloadCVs: false
  });
  
  // Set up event listeners for IPC events
  useEffect(() => {
    if (!ipcRenderer) {
      setError('IPC Renderer not available');
      return;
    }
    
    // Handle extraction events
    const handlers = {
      'linkedin:extraction-started': (event, data) => {
        console.log('Extraction started:', data);
        setIsExtracting(true);
        setIsPaused(false);
        setProgress(prev => ({
          ...prev,
          total: data.estimatedTotal,
          current: 0,
          percentage: 0
        }));
        setError(null);
      },
      
      'linkedin:extraction-progress': (event, data) => {
        console.log('Extraction progress:', data);
        setProgress({
          current: data.current,
          total: data.total,
          percentage: data.percentage,
          currentApplicant: data.currentApplicant
        });
      },
      
      'linkedin:extraction-paused': (event, data) => {
        console.log('Extraction paused:', data);
        setIsPaused(true);
      },
      
      'linkedin:extraction-resumed': (event, data) => {
        console.log('Extraction resumed:', data);
        setIsPaused(false);
      },
      
      'linkedin:extraction-completed': (event, data) => {
        console.log('Extraction completed:', data);
        setIsExtracting(false);
        setIsPaused(false);
        setApplicants(data.applicants || []);
        
        // Get latest operation state
        fetchOperationState();
      },
      
      'linkedin:extraction-error': (event, data) => {
        console.error('Extraction error:', data);
        setError(`${data.error} (${data.errorCode}): ${data.context}`);
        
        // May need to stop extraction if error is not recoverable
        if (!data.recoverable) {
          setIsExtracting(false);
        }
      },
      
      'linkedin:batch-started': (event, data) => {
        console.log('Batch started:', data);
        setBatchProgress({
          current: data.currentBatch,
          total: data.totalBatches
        });
      },
      
      'linkedin:batch-completed': (event, data) => {
        console.log('Batch completed:', data);
        setBatchProgress(prev => ({
          ...prev,
          current: data.currentBatch
        }));
      }
    };
    
    // Register event listeners
    Object.entries(handlers).forEach(([channel, handler]) => {
      ipcRenderer.on(channel, handler);
    });
    
    // Cleanup function to remove listeners
    return () => {
      Object.entries(handlers).forEach(([channel, handler]) => {
        ipcRenderer.removeListener(channel, handler);
      });
    };
  }, []);
  
  // Fetch current operation state
  const fetchOperationState = useCallback(async () => {
    try {
      const response = await ipcRenderer.invoke('linkedin:getOperationState');
      if (response.success) {
        setOperationState(response.state);
      } else {
        console.error('Failed to get operation state:', response.error);
      }
    } catch (err) {
      console.error('Error fetching operation state:', err);
    }
  }, []);
  
  // Periodically update operation state when extracting
  useEffect(() => {
    if (!isExtracting) return;
    
    const intervalId = setInterval(fetchOperationState, 2000);
    return () => clearInterval(intervalId);
  }, [isExtracting, fetchOperationState]);
  
  // Start extraction
  const startExtraction = async () => {
    try {
      // Reset state
      setError(null);
      setApplicants([]);
      
      // Use enhanced method based on selected options
      let response;
      
      if (options.getDetailedProfiles || options.downloadCVs) {
        // Use full job processing for enhanced features
        response = await ipcRenderer.invoke('linkedin:processJobApplicants', {
          jobId,
          options
        });
      } else {
        // Use simple applicant extraction
        response = await ipcRenderer.invoke('linkedin:getApplicants', {
          jobId,
          options
        });
      }
      
      if (!response.success) {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Pause extraction
  const pauseExtraction = async () => {
    try {
      const response = await ipcRenderer.invoke('linkedin:pauseOperation');
      if (!response.success) {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Resume extraction
  const resumeExtraction = async () => {
    try {
      const response = await ipcRenderer.invoke('linkedin:resumeOperation');
      if (!response.success) {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Stop extraction
  const stopExtraction = async () => {
    try {
      const response = await ipcRenderer.invoke('linkedin:stopOperation');
      if (!response.success) {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Export results
  const exportResults = async () => {
    try {
      const timestamp = new Date().toISOString().replace(/[:T]/g, '-').split('.')[0];
      const response = await ipcRenderer.invoke('linkedin:exportOperationResults', {
        fileName: `job-${jobId}-results-${timestamp}.json`
      });
      
      if (response.success) {
        alert(`Results exported to: ${response.filePath}`);
      } else {
        setError(response.error);
      }
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Handle option changes
  const handleOptionChange = (key, value) => {
    setOptions(prev => ({
      ...prev,
      [key]: key === 'batchSize' || key === 'maxApplicants' || key === 'pauseBetweenBatches' 
        ? parseInt(value, 10) 
        : value
    }));
  };
  
  return (
    <div className="linkedin-extractor">
      <h2>LinkedIn Applicant Extractor</h2>
      
      {/* Job ID display */}
      <div className="job-info">
        <h3>Job ID: {jobId}</h3>
      </div>
      
      {/* Extraction options */}
      <div className="extraction-options">
        <h3>Extraction Options</h3>
        
        <div className="option-group">
          <label>
            Batch Size:
            <input 
              type="number" 
              value={options.batchSize} 
              onChange={(e) => handleOptionChange('batchSize', e.target.value)}
              disabled={isExtracting}
              min="1"
              max="30"
            />
          </label>
          
          <label>
            Max Applicants:
            <input 
              type="number" 
              value={options.maxApplicants} 
              onChange={(e) => handleOptionChange('maxApplicants', e.target.value)}
              disabled={isExtracting}
              min="1"
            />
          </label>
          
          <label>
            Pause Between Batches (ms):
            <input 
              type="number" 
              value={options.pauseBetweenBatches} 
              onChange={(e) => handleOptionChange('pauseBetweenBatches', e.target.value)}
              disabled={isExtracting}
              min="1000"
              step="1000"
            />
          </label>
        </div>
        
        <div className="option-group">
          <label>
            <input 
              type="checkbox" 
              checked={options.getDetailedProfiles} 
              onChange={(e) => handleOptionChange('getDetailedProfiles', e.target.checked)}
              disabled={isExtracting}
            />
            Get Detailed Profiles
          </label>
          
          <label>
            <input 
              type="checkbox" 
              checked={options.downloadCVs} 
              onChange={(e) => handleOptionChange('downloadCVs', e.target.checked)}
              disabled={isExtracting}
            />
            Download CVs (if available)
          </label>
        </div>
      </div>
      
      {/* Control buttons */}
      <div className="control-buttons">
        {!isExtracting ? (
          <button 
            onClick={startExtraction} 
            disabled={!jobId}
            className="start-button"
          >
            Start Extraction
          </button>
        ) : (
          <>
            {isPaused ? (
              <button onClick={resumeExtraction} className="resume-button">
                Resume Extraction
              </button>
            ) : (
              <button onClick={pauseExtraction} className="pause-button">
                Pause Extraction
              </button>
            )}
            
            <button onClick={stopExtraction} className="stop-button">
              Stop Extraction
            </button>
          </>
        )}
        
        <button 
          onClick={exportResults} 
          disabled={!applicants.length && (!operationState || !operationState.processedItems.length)}
          className="export-button"
        >
          Export Results
        </button>
      </div>
      
      {/* Progress display */}
      {isExtracting && (
        <div className="progress-container">
          <h3>Extraction Progress</h3>
          
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${progress.percentage}%` }}
            ></div>
            <span className="progress-text">
              {progress.percentage}% ({progress.current}/{progress.total})
            </span>
          </div>
          
          {progress.currentApplicant && (
            <div className="current-item">
              Currently processing: {progress.currentApplicant}
            </div>
          )}
          
          {batchProgress.total > 0 && (
            <div className="batch-progress">
              Batch: {batchProgress.current}/{batchProgress.total}
            </div>
          )}
          
          {isPaused && (
            <div className="paused-notice">
              Extraction paused. Resume to continue.
            </div>
          )}
        </div>
      )}
      
      {/* Error display */}
      {error && (
        <div className="error-container">
          <h3>Error</h3>
          <p className="error-message">{error}</p>
        </div>
      )}
      
      {/* Results display */}
      {applicants.length > 0 && (
        <div className="results-container">
          <h3>Extracted Applicants ({applicants.length})</h3>
          
          <table className="applicants-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Headline</th>
                <th>Location</th>
                <th>Profile</th>
                {options.downloadCVs && <th>CV</th>}
              </tr>
            </thead>
            <tbody>
              {applicants.map((applicant, index) => (
                <tr key={index}>
                  <td>{applicant.name}</td>
                  <td>{applicant.headline}</td>
                  <td>{applicant.location}</td>
                  <td>
                    {applicant.profileUrl && (
                      <a 
                        href="#" 
                        onClick={() => window.electron.shell.openExternal(applicant.profileUrl)}
                      >
                        View Profile
                      </a>
                    )}
                  </td>
                  {options.downloadCVs && (
                    <td>
                      {applicant.cvDownload && applicant.cvDownload.success ? (
                        <a 
                          href="#" 
                          onClick={() => window.electron.shell.openPath(applicant.cvDownload.filePath)}
                        >
                          Open CV
                        </a>
                      ) : (
                        <span className="no-cv">Not Available</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Statistics */}
      {operationState && operationState.processedItems.length > 0 && (
        <div className="stats-container">
          <h3>Operation Statistics</h3>
          
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Processed:</span>
              <span className="stat-value">{operationState.processedItems.length}</span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Successful:</span>
              <span className="stat-value">
                {operationState.processedItems.filter(item => item.success).length}
              </span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Failed:</span>
              <span className="stat-value">
                {operationState.processedItems.filter(item => !item.success).length}
              </span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Success Rate:</span>
              <span className="stat-value">
                {operationState.processedItems.length > 0 
                  ? `${(operationState.processedItems.filter(item => item.success).length / 
                      operationState.processedItems.length * 100).toFixed(1)}%`
                  : '0%'
                }
              </span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Total Time:</span>
              <span className="stat-value">
                {operationState.startTime 
                  ? `${((Date.now() - operationState.startTime) / 1000).toFixed(1)} seconds`
                  : 'N/A'
                }
              </span>
            </div>
            
            <div className="stat-item">
              <span className="stat-label">Errors:</span>
              <span className="stat-value">{operationState.errors.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

ExtractorUI.propTypes = {
  jobId: PropTypes.string.isRequired
};

export default ExtractorUI;