import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  UserIcon, 
  ChevronRightIcon, 
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

/**
 * Component for displaying a list of extracted LinkedIn applicants
 */
const ApplicantList = ({ 
  applicants = [], 
  loading = false,
  onImportAll = () => {},
  onImportSelected = () => {}
}) => {
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Toggle selection of a single applicant
   */
  const toggleApplicantSelection = (applicantId) => {
    if (selectedApplicants.includes(applicantId)) {
      setSelectedApplicants(selectedApplicants.filter(id => id !== applicantId));
    } else {
      setSelectedApplicants([...selectedApplicants, applicantId]);
    }
  };

  /**
   * Toggle selection of all applicants
   */
  const toggleSelectAll = () => {
    if (selectedApplicants.length === filteredApplicants.length) {
      setSelectedApplicants([]);
    } else {
      setSelectedApplicants(filteredApplicants.map(a => a.id));
    }
  };

  /**
   * Apply filters to the applicant list
   */
  const filteredApplicants = applicants.filter(applicant => {
    // Apply status filter
    if (filterStatus !== 'all' && applicant.status !== filterStatus) {
      return false;
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        applicant.name?.toLowerCase().includes(query) ||
        applicant.title?.toLowerCase().includes(query) ||
        applicant.company?.toLowerCase().includes(query) ||
        applicant.location?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  /**
   * Import selected applicants
   */
  const handleImportSelected = () => {
    const applicantsToImport = applicants.filter(a => selectedApplicants.includes(a.id));
    onImportSelected(applicantsToImport);
  };

  /**
   * Render applicant status badge
   */
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'new':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ClockIcon className="mr-1 h-3 w-3" />
            New
          </span>
        );
      case 'imported':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="mr-1 h-3 w-3" />
            Imported
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="mr-1 h-3 w-3" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
        <div className="flex items-center justify-between flex-wrap sm:flex-nowrap">
          <div>
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Extracted Applicants
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {applicants.length} applicants extracted from LinkedIn
            </p>
          </div>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleImportSelected}
              disabled={loading || selectedApplicants.length === 0}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
            >
              <ArrowDownTrayIcon className="-ml-0.5 mr-2 h-4 w-4" />
              Import Selected
            </button>
            
            <button
              type="button"
              onClick={onImportAll}
              disabled={loading || applicants.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
            >
              Import All
            </button>
          </div>
        </div>
        
        {/* Filters and search */}
        <div className="mt-4 flex flex-col md:flex-row justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <span className="text-sm font-medium text-gray-700 flex items-center">
              <FunnelIcon className="h-4 w-4 mr-1" />
              Filter:
            </span>
            <div className="flex">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1 text-sm font-medium rounded-l-md ${
                  filterStatus === 'all'
                    ? 'bg-linkedin-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('new')}
                className={`px-3 py-1 text-sm font-medium ${
                  filterStatus === 'new'
                    ? 'bg-linkedin-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                New
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('imported')}
                className={`px-3 py-1 text-sm font-medium ${
                  filterStatus === 'imported'
                    ? 'bg-linkedin-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Imported
              </button>
              <button
                type="button"
                onClick={() => setFilterStatus('rejected')}
                className={`px-3 py-1 text-sm font-medium rounded-r-md ${
                  filterStatus === 'rejected'
                    ? 'bg-linkedin-blue text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Rejected
              </button>
            </div>
          </div>
          
          <div className="max-w-xs w-full">
            <div className="relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                </svg>
              </div>
              <input
                type="text"
                className="focus:ring-linkedin-blue focus:border-linkedin-blue block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                placeholder="Search applicants"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-linkedin-blue"></div>
        </div>
      ) : filteredApplicants.length === 0 ? (
        <div className="text-center p-12">
          <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No applicants found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {applicants.length === 0 
              ? 'Start an extraction to see applicants here.'
              : 'Try changing your filters to see more results.'}
          </p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <div className="flex items-center">
                      <input
                        id="select-all"
                        type="checkbox"
                        className="h-4 w-4 text-linkedin-blue focus:ring-linkedin-blue border-gray-300 rounded"
                        checked={selectedApplicants.length === filteredApplicants.length && filteredApplicants.length > 0}
                        onChange={toggleSelectAll}
                      />
                      <label htmlFor="select-all" className="sr-only">
                        Select all
                      </label>
                    </div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">View</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredApplicants.map((applicant) => (
                  <tr key={applicant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input
                          id={`applicant-${applicant.id}`}
                          type="checkbox"
                          className="h-4 w-4 text-linkedin-blue focus:ring-linkedin-blue border-gray-300 rounded"
                          checked={selectedApplicants.includes(applicant.id)}
                          onChange={() => toggleApplicantSelection(applicant.id)}
                        />
                        <label htmlFor={`applicant-${applicant.id}`} className="sr-only">
                          Select {applicant.name}
                        </label>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {applicant.profileImage ? (
                            <img className="h-10 w-10 rounded-full" src={applicant.profileImage} alt={applicant.name} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{applicant.name}</div>
                          <div className="text-sm text-gray-500">
                            {applicant.title}
                            {applicant.company && (
                              <>
                                <span className="mx-1">•</span>
                                {applicant.company}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{applicant.location || 'Unknown'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {renderStatusBadge(applicant.status || 'new')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link 
                        to={`/applicants/${applicant.id}`} 
                        className="text-linkedin-blue hover:text-linkedin-dark-blue flex items-center justify-end"
                      >
                        View
                        <ChevronRightIcon className="ml-1 h-4 w-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination would go here */}
        </>
      )}
    </div>
  );
};

export default ApplicantList;