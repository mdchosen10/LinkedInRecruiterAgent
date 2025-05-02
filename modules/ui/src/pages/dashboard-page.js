import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../contexts/DataContext';

// Components
import CandidateCard from '../components/candidates/CandidateCard';
import DashboardStats from '../components/dashboard/DashboardStats';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import RecentMessages from '../components/dashboard/RecentMessages';
import DashboardFilters from '../components/dashboard/DashboardFilters';

// Charts
import CandidateScoreChart from '../components/dashboard/CandidateScoreChart';

// Icons
import { UserPlusIcon } from '@heroicons/react/24/outline';

const DashboardPage = () => {
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
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of your recruiting activities and candidates
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
      
      {/* Statistics cards */}
      <DashboardStats />
      
      {/* Dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - candidates */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <DashboardFilters 
            filters={filters} 
            updateFilters={updateFilters} 
          />
          
          {/* Candidate score distribution */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Candidate Score Distribution</h2>
            <div className="h-64">
              <CandidateScoreChart 
                candidates={filteredCandidates} 
              />
            </div>
          </div>
          
          {/* Top candidates */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Top Candidates</h2>
              <Link 
                to="/candidates" 
                className="text-sm font-medium text-linkedin-blue hover:text-linkedin-dark-blue"
              >
                View all
              </Link>
            </div>
            
            {candidatesLoading ? (
              <div className="py-12 flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-linkedin-blue"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredCandidates.slice(0, 3).map(candidate => (
                  <CandidateCard 
                    key={candidate.id} 
                    candidate={candidate} 
                  />
                ))}
                
                {filteredCandidates.length === 0 && (
                  <div className="card p-6 text-center">
                    <p className="text-gray-500">No candidates match your filters</p>
                    <button
                      onClick={() => updateFilters({
                        search: '',
                        status: 'all',
                        minScore: 0,
                        skills: []
                      })}
                      className="mt-2 text-sm text-linkedin-blue hover:text-linkedin-dark-blue"
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Recent activity */}
          <div className="card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
            <ActivityFeed />
          </div>
          
          {/* Recent messages */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-gray-900">Recent Messages</h2>
              <Link 
                to="/messaging" 
                className="text-sm font-medium text-linkedin-blue hover:text-linkedin-dark-blue"
              >
                View all
              </Link>
            </div>
            <RecentMessages />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;