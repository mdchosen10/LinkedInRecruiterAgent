import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/data-context';

// Components
import CandidateCard from '../components/candidates/candidate-card';
import DashboardFilters from '../components/candidates/dashboard/dashboard-filters';

// Icons
import { UserPlusIcon } from '@heroicons/react/24/outline';

const CandidatesPage = () => {
  const { 
    filteredCandidates,
    candidatesLoading,
    loadCandidates,
    filters,
    updateFilters
  } = useData();
  
  // Load candidates when component mounts
  useEffect(() => {
    loadCandidates();
  }, [loadCandidates]);
  
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Candidates</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage and evaluate your candidate pipeline
          </p>
        </div>
        <div>
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
          >
            <UserPlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Candidate
          </button>
        </div>
      </div>
      
      {/* Filters */}
      <DashboardFilters 
        filters={filters} 
        updateFilters={updateFilters} 
      />
      
      {/* Candidates list */}
      <div className="space-y-4">
        {candidatesLoading ? (
          <div className="py-12 flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-linkedin-blue"></div>
          </div>
        ) : (
          <>
            {filteredCandidates.length === 0 ? (
              <div className="bg-white shadow rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium text-gray-900">No candidates found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  No candidates match your current filters.
                </p>
                <button
                  onClick={() => updateFilters({
                    search: '',
                    status: 'all',
                    minScore: 0,
                    skills: []
                  })}
                  className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredCandidates.map((candidate) => (
                <CandidateCard 
                  key={candidate.id} 
                  candidate={candidate} 
                />
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CandidatesPage;