import React from 'react';
import { Link } from 'react-router-dom';

// Status badge component
const StatusBadge = ({ status }) => {
  let colorClass = '';
  
  switch (status) {
    case 'new':
      colorClass = 'bg-blue-100 text-blue-800';
      break;
    case 'contacted':
      colorClass = 'bg-yellow-100 text-yellow-800';
      break;
    case 'screening':
      colorClass = 'bg-purple-100 text-purple-800';
      break;
    case 'interviewing':
      colorClass = 'bg-indigo-100 text-indigo-800';
      break;
    case 'offered':
      colorClass = 'bg-green-100 text-green-800';
      break;
    case 'rejected':
      colorClass = 'bg-red-100 text-red-800';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800';
  }
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Score indicator component
const ScoreIndicator = ({ score }) => {
  let colorClass = '';
  
  if (score >= 90) {
    colorClass = 'text-green-600 bg-green-100';
  } else if (score >= 75) {
    colorClass = 'text-blue-600 bg-blue-100';
  } else if (score >= 60) {
    colorClass = 'text-yellow-600 bg-yellow-100';
  } else {
    colorClass = 'text-gray-600 bg-gray-100';
  }
  
  return (
    <span className={`inline-flex items-center justify-center h-8 w-8 rounded-full ${colorClass} font-medium text-sm`}>
      {score}
    </span>
  );
};

const CandidateCard = ({ candidate }) => {
  if (!candidate) return null;
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-5">
        <div className="flex items-center">
          {/* Candidate photo */}
          <div className="flex-shrink-0 mr-4">
            {candidate.photo ? (
              <img
                className="h-12 w-12 rounded-full object-cover"
                src={candidate.photo}
                alt={candidate.name}
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-linkedin-blue flex items-center justify-center">
                <span className="text-white font-medium text-lg">
                  {candidate.name.charAt(0)}
                </span>
              </div>
            )}
          </div>
          
          {/* Candidate info */}
          <div className="flex-1 min-w-0">
            <Link 
              to={`/candidates/${candidate.id}`}
              className="text-lg font-medium text-gray-900 hover:text-linkedin-blue"
            >
              {candidate.name}
            </Link>
            <p className="text-sm text-gray-500 truncate">
              {candidate.title} at {candidate.company}
            </p>
            <p className="text-xs text-gray-400">
              {candidate.location}
            </p>
          </div>
          
          {/* Score & status */}
          <div className="flex flex-col items-end space-y-2">
            <ScoreIndicator score={candidate.score} />
            <StatusBadge status={candidate.status} />
          </div>
        </div>
        
        {/* Skills */}
        <div className="mt-4">
          <div className="flex flex-wrap gap-2">
            {candidate.skills.slice(0, 5).map((skill, index) => (
              <span 
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
              >
                {skill}
              </span>
            ))}
            {candidate.skills.length > 5 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                +{candidate.skills.length - 5} more
              </span>
            )}
          </div>
        </div>
        
        {/* Actions */}
        <div className="mt-4 flex justify-between items-center">
          <div className="text-xs text-gray-500">
            {candidate.lastContact 
              ? `Last contacted: ${new Date(candidate.lastContact).toLocaleDateString()}` 
              : 'Not contacted yet'}
          </div>
          
          <div className="flex space-x-2">
            <Link
              to={`/candidates/${candidate.id}`}
              className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
            >
              View Profile
            </Link>
            <Link
              to={`/messaging?candidateId=${candidate.id}`}
              className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
            >
              Message
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateCard;