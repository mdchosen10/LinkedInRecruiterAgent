import React, { useState } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

const CandidateSelector = ({ candidates, selectedCandidate, onCandidateChange }) => {
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter candidates based on search query
  const filteredCandidates = candidates.filter(candidate => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      candidate.name.toLowerCase().includes(query) ||
      candidate.title.toLowerCase().includes(query) ||
      candidate.company.toLowerCase().includes(query)
    );
  });
  
  // Handle candidate selection
  const handleCandidateSelect = (candidate) => {
    onCandidateChange(candidate);
  };
  
  return (
    <div>
      {/* Search input */}
      <div className="relative rounded-md shadow-sm mb-4">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
        </div>
        <input
          type="text"
          className="focus:ring-linkedin-blue focus:border-linkedin-blue block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
          placeholder="Search candidates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      
      {/* Selected candidate */}
      {selectedCandidate && (
        <div className="bg-linkedin-lightest-blue border border-linkedin-blue rounded-md p-3 mb-4">
          <div className="flex items-center">
            {/* Candidate photo */}
            <div className="flex-shrink-0 mr-3">
              {selectedCandidate.photo ? (
                <img
                  className="h-10 w-10 rounded-full object-cover"
                  src={selectedCandidate.photo}
                  alt={selectedCandidate.name}
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-linkedin-blue flex items-center justify-center">
                  <span className="text-white font-medium">
                    {selectedCandidate.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Candidate info */}
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                {selectedCandidate.name}
              </h3>
              <p className="text-xs text-gray-500">
                {selectedCandidate.title} at {selectedCandidate.company}
              </p>
            </div>
            
            {/* Clear selection */}
            <button
              type="button"
              onClick={() => onCandidateChange(null)}
              className="text-linkedin-blue hover:text-linkedin-dark-blue text-sm font-medium"
            >
              Change
            </button>
          </div>
        </div>
      )}
      
      {/* Candidate list */}
      {!selectedCandidate && (
        <div className="border border-gray-200 rounded-md overflow-hidden">
          <ul className="divide-y divide-gray-200 max-h-64 overflow-y-auto">
            {filteredCandidates.length === 0 ? (
              <li className="px-4 py-4 text-center text-sm text-gray-500">
                No candidates found
              </li>
            ) : (
              filteredCandidates.map((candidate) => (
                <li
                  key={candidate.id}
                  className="px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleCandidateSelect(candidate)}
                >
                  <div className="flex items-center">
                    {/* Candidate photo */}
                    <div className="flex-shrink-0 mr-3">
                      {candidate.photo ? (
                        <img
                          className="h-8 w-8 rounded-full object-cover"
                          src={candidate.photo}
                          alt={candidate.name}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-linkedin-blue flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {candidate.name.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Candidate info */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {candidate.name}
                      </h3>
                      <p className="text-xs text-gray-500 truncate">
                        {candidate.title} at {candidate.company}
                      </p>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CandidateSelector;