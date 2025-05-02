import React, { useState } from 'react';
import { 
  AdjustmentsHorizontalIcon, 
  XMarkIcon, 
  MagnifyingGlassIcon 
} from '@heroicons/react/24/outline';

const DashboardFilters = ({ filters, updateFilters }) => {
  const [showFilters, setShowFilters] = useState(false);
  
  // All possible statuses
  const statuses = [
    { value: 'all', label: 'All Statuses' },
    { value: 'new', label: 'New' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'screening', label: 'Screening' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'offered', label: 'Offered' },
    { value: 'rejected', label: 'Rejected' }
  ];
  
  // Common skills for filtering
  const commonSkills = [
    'JavaScript',
    'React',
    'Node.js',
    'Python',
    'Java',
    'C#',
    'AWS',
    'SQL',
    'Product Management',
    'UX/UI Design'
  ];
  
  // Handle search input
  const handleSearchChange = (e) => {
    updateFilters({ search: e.target.value });
  };
  
  // Handle status selection
  const handleStatusChange = (e) => {
    updateFilters({ status: e.target.value });
  };
  
  // Handle minimum score selection
  const handleScoreChange = (e) => {
    updateFilters({ minScore: parseInt(e.target.value, 10) });
  };
  
  // Handle skill selection
  const handleSkillToggle = (skill) => {
    const updatedSkills = [...filters.skills];
    
    if (updatedSkills.includes(skill)) {
      // Remove skill if already selected
      const index = updatedSkills.indexOf(skill);
      updatedSkills.splice(index, 1);
    } else {
      // Add skill if not selected
      updatedSkills.push(skill);
    }
    
    updateFilters({ skills: updatedSkills });
  };
  
  // Clear all filters
  const clearFilters = () => {
    updateFilters({
      search: '',
      status: 'all',
      minScore: 0,
      skills: []
    });
  };
  
  return (
    <div className="card">
      {/* Search and filter toggle */}
      <div className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <div className="relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </div>
            <input
              type="text"
              className="focus:ring-linkedin-blue focus:border-linkedin-blue block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              placeholder="Search candidates by name, title, skills..."
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        
        <button
          type="button"
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
        >
          <AdjustmentsHorizontalIcon className="-ml-0.5 mr-2 h-4 w-4" aria-hidden="true" />
          Filters
          {(filters.status !== 'all' || filters.minScore > 0 || filters.skills.length > 0) && (
            <span className="ml-1.5 flex h-2 w-2 rounded-full bg-linkedin-blue"></span>
          )}
        </button>
      </div>
      
      {/* Advanced filters */}
      {showFilters && (
        <div className="mt-4 border-t border-gray-200 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Status filter */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-linkedin-blue focus:border-linkedin-blue sm:text-sm rounded-md"
                value={filters.status}
                onChange={handleStatusChange}
              >
                {statuses.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Minimum score filter */}
            <div>
              <label htmlFor="minScore" className="block text-sm font-medium text-gray-700">
                Minimum Score
              </label>
              <select
                id="minScore"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-linkedin-blue focus:border-linkedin-blue sm:text-sm rounded-md"
                value={filters.minScore}
                onChange={handleScoreChange}
              >
                <option value="0">Any Score</option>
                <option value="70">70+</option>
                <option value="80">80+</option>
                <option value="90">90+</option>
              </select>
            </div>
            
            {/* Skills filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Skills
              </label>
              <div className="mt-1 flex flex-wrap gap-2">
                {commonSkills.slice(0, 8).map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-sm ${
                      filters.skills.includes(skill)
                        ? 'bg-linkedin-lightest-blue text-linkedin-blue'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`}
                  >
                    {skill}
                    {filters.skills.includes(skill) && (
                      <XMarkIcon className="ml-1.5 h-3 w-3" aria-hidden="true" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* Filter actions */}
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardFilters;