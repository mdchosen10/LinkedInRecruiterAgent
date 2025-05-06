import React, { useState } from 'react';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

/**
 * Component for entering LinkedIn job URLs
 */
const JobSelector = ({ jobUrls = [], onChange, disabled = false }) => {
  const [newJobUrl, setNewJobUrl] = useState('');
  const [error, setError] = useState('');

  /**
   * Add a new job URL to the list
   */
  const addJobUrl = () => {
    // Basic validation
    if (!newJobUrl) {
      setError('Please enter a job URL');
      return;
    }

    // Simple URL validation
    if (!newJobUrl.startsWith('https://www.linkedin.com/jobs/')) {
      setError('Please enter a valid LinkedIn job URL');
      return;
    }

    // Check for duplicates
    if (jobUrls.includes(newJobUrl)) {
      setError('This job URL is already in the list');
      return;
    }

    // Add URL to the list
    const updatedUrls = [...jobUrls, newJobUrl];
    onChange(updatedUrls);
    
    // Reset input
    setNewJobUrl('');
    setError('');
  };

  /**
   * Remove a job URL from the list
   */
  const removeJobUrl = (urlToRemove) => {
    const updatedUrls = jobUrls.filter(url => url !== urlToRemove);
    onChange(updatedUrls);
  };

  /**
   * Handle input changes
   */
  const handleInputChange = (e) => {
    setNewJobUrl(e.target.value);
    if (error) setError('');
  };

  /**
   * Handle keypress (submit on Enter)
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addJobUrl();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col">
        <label htmlFor="jobUrl" className="block text-sm font-medium text-gray-700 mb-1">
          LinkedIn Job URL
        </label>
        
        <div className="flex">
          <input
            type="text"
            id="jobUrl"
            name="jobUrl"
            value={newJobUrl}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder="https://www.linkedin.com/jobs/view/..."
            disabled={disabled}
            className="flex-1 focus:ring-linkedin-blue focus:border-linkedin-blue block w-full shadow-sm sm:text-sm border-gray-300 rounded-l-md"
          />
          <button
            type="button"
            onClick={addJobUrl}
            disabled={disabled}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add
          </button>
        </div>
        
        {error && (
          <p className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
        
        <p className="mt-1 text-xs text-gray-500">
          Enter LinkedIn job URLs to extract applicant data. Example: https://www.linkedin.com/jobs/view/1234567890
        </p>
      </div>

      {/* Selected Job URLs list */}
      {jobUrls.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Jobs:</h4>
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
            {jobUrls.map((url, index) => (
              <li key={index} className="flex items-center justify-between px-4 py-3">
                <div className="truncate flex-1">
                  <a 
                    href={url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-linkedin-blue hover:underline truncate"
                  >
                    {url}
                  </a>
                </div>
                <button
                  type="button"
                  onClick={() => removeJobUrl(url)}
                  disabled={disabled}
                  className="ml-2 text-gray-400 hover:text-red-500 focus:outline-none disabled:opacity-50"
                >
                  <TrashIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default JobSelector;