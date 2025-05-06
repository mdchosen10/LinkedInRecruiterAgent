import React from 'react';
import {
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';

/**
 * Component for displaying LinkedIn extraction progress
 */
const ExtractionProgress = ({ 
  status = 'idle', 
  progress = { current: 0, total: 0 }, 
  error = null,
  onRetry = null 
}) => {
  // Calculate percentage for progress bar
  const percentage = progress.total > 0 
    ? Math.round((progress.current / progress.total) * 100) 
    : 0;

  // Status badge content based on current status
  const renderStatusBadge = () => {
    switch (status) {
      case 'idle':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            Ready
          </span>
        );
      case 'connecting':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
            Connecting
          </span>
        );
      case 'extracting':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
            Extracting
          </span>
        );
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            Completed
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
            Error
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // Status icon based on current status
  const renderStatusIcon = () => {
    switch (status) {
      case 'idle':
        return <ClockIcon className="h-8 w-8 text-gray-400" />;
      case 'connecting':
      case 'extracting':
        return <ArrowPathIcon className="h-8 w-8 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircleIcon className="h-8 w-8 text-green-500" />;
      case 'error':
        return <ExclamationCircleIcon className="h-8 w-8 text-red-500" />;
      default:
        return <ClockIcon className="h-8 w-8 text-gray-400" />;
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg shadow-sm p-4 bg-white">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Extraction Status</h3>
        {renderStatusBadge()}
      </div>

      {/* Progress visualization */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-shrink-0">
          {renderStatusIcon()}
        </div>
        <div className="flex-1">
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              {status === 'idle' && 'Waiting to start...'}
              {status === 'connecting' && 'Connecting to LinkedIn...'}
              {status === 'extracting' && `Extracting profiles (${progress.current}/${progress.total})`}
              {status === 'completed' && `Completed (${progress.total} profiles extracted)`}
              {status === 'error' && 'Extraction failed'}
            </span>
            {(status === 'extracting' || status === 'completed') && (
              <span className="text-sm font-medium text-gray-700">{percentage}%</span>
            )}
          </div>
          
          <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
            <div 
              style={{ width: `${percentage}%` }} 
              className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                status === 'completed' ? 'bg-green-500' : 'bg-linkedin-blue'
              }`}
            ></div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {status === 'error' && error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Details</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              {onRetry && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={onRetry}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Retry Extraction
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status description */}
      <div className="text-sm text-gray-500">
        {status === 'idle' && 'Add job URLs and click "Start Extraction" to begin.'}
        {status === 'connecting' && 'Opening LinkedIn in a browser window. Please wait...'}
        {status === 'extracting' && 'Extracting applicant profiles from LinkedIn. This may take a few minutes.'}
        {status === 'completed' && 'Extraction completed successfully. You can now view and analyze the extracted profiles.'}
        {status === 'error' && 'An error occurred during extraction. Please check the error details and try again.'}
      </div>
    </div>
  );
};

export default ExtractionProgress;