import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Icons
import {
  EnvelopeIcon,
  PhoneIcon,
  LinkIcon,
  PencilSquareIcon
} from '@heroicons/react/24/outline';

const CandidateHeader = ({ candidate, onStatusChange, saving }) => {
  const [isEditingStatus, setIsEditingStatus] = useState(false);
  const [status, setStatus] = useState(candidate?.status || 'new');
  
  // All possible statuses
  const statuses = [
    { value: 'new', label: 'New', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    { value: 'contacted', label: 'Contacted', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    { value: 'screening', label: 'Screening', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    { value: 'interviewing', label: 'Interviewing', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    { value: 'offered', label: 'Offered', color: 'bg-green-100 text-green-800 border-green-200' },
    { value: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800 border-red-200' },
    { value: 'hired', label: 'Hired', color: 'bg-teal-100 text-teal-800 border-teal-200' }
  ];
  
  // Get status object
  const getStatusObject = (statusValue) => {
    return statuses.find(s => s.value === statusValue) || statuses[0];
  };
  
  // Handle status change
  const handleStatusChange = (e) => {
    setStatus(e.target.value);
  };
  
  // Save status change
  const saveStatusChange = () => {
    onStatusChange(status);
    setIsEditingStatus(false);
  };
  
  // Start editing status
  const startEditingStatus = () => {
    setStatus(candidate.status);
    setIsEditingStatus(true);
  };
  
  // Cancel editing
  const cancelEditing = () => {
    setIsEditingStatus(false);
  };
  
  if (!candidate) return null;
  
  const currentStatus = getStatusObject(candidate.status);
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Candidate info */}
          <div className="flex items-center">
            {/* Photo */}
            <div className="flex-shrink-0 mr-4">
              {candidate.photo ? (
                <img
                  className="h-20 w-20 rounded-full object-cover"
                  src={candidate.photo}
                  alt={candidate.name}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-linkedin-blue flex items-center justify-center">
                  <span className="text-white font-medium text-2xl">
                    {candidate.name.charAt(0)}
                  </span>
                </div>
              )}
            </div>
            
            {/* Name and title */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {candidate.name}
              </h1>
              <p className="text-lg text-gray-500">
                {candidate.title} at {candidate.company}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {candidate.location}
              </p>
            </div>
          </div>
          
          {/* Status and score */}
          <div className="mt-4 md:mt-0 flex flex-col items-end">
            {/* Score */}
            <div className="flex items-center mb-2">
              <span className="text-sm font-medium text-gray-500 mr-2">Score:</span>
              <span className="text-xl font-semibold text-gray-900">{candidate.score}</span>
              <span className="ml-1 text-sm font-medium text-gray-500">/100</span>
            </div>
            
            {/* Status */}
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-500 mr-2">Status:</span>
              
              {isEditingStatus ? (
                <div className="flex items-center">
                  <select
                    value={status}
                    onChange={handleStatusChange}
                    className="mr-2 block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-linkedin-blue focus:border-linkedin-blue sm:text-sm rounded-md"
                    disabled={saving}
                  >
                    {statuses.map((statusOption) => (
                      <option key={statusOption.value} value={statusOption.value}>
                        {statusOption.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={saveStatusChange}
                    disabled={saving}
                    className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50 mr-1"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    disabled={saving}
                    className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center">
                  <span 
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStatus.color}`}
                  >
                    {currentStatus.label}
                  </span>
                  <button
                    type="button"
                    onClick={startEditingStatus}
                    className="ml-2 text-gray-400 hover:text-gray-500"
                  >
                    <PencilSquareIcon className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Contact and links */}
        <div className="mt-6 border-t border-gray-200 pt-4">
          <div className="flex flex-wrap gap-4">
            {/* LinkedIn */}
            <a
              href="#linkedin"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-linkedin-blue hover:bg-linkedin-lightest-blue rounded-md"
            >
              <LinkIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
              LinkedIn Profile
            </a>
            
            {/* Email */}
            <a
              href="#email"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
            >
              <EnvelopeIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Email
            </a>
            
            {/* Phone */}
            <a
              href="#phone"
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
            >
              <PhoneIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
              Call
            </a>
            
            {/* Message */}
            <Link
              to={`/messaging?candidateId=${candidate.id}`}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
            >
              Message Candidate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateHeader;