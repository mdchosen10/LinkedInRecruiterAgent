import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// Icons
import { 
  EnvelopeIcon, 
  CalendarIcon, 
  DocumentTextIcon,
  ArchiveBoxIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const CandidateActions = ({ candidate }) => {
  const [isFavorite, setIsFavorite] = useState(candidate?.isFavorite || false);
  
  // Toggle favorite status
  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // In a real app, you would save this to the backend
  };
  
  if (!candidate) return null;
  
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4">
        <h3 className="text-base font-medium text-gray-900 mb-3">Actions</h3>
        
        <div className="space-y-2">
          {/* Message button */}
          <Link
            to={`/messaging?candidateId=${candidate.id}`}
            className="w-full inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-linkedin-blue hover:bg-linkedin-dark-blue focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
          >
            <EnvelopeIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Send Message
          </Link>
          
          {/* Schedule Interview button */}
          <button
            type="button"
            className="w-full inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
          >
            <CalendarIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Schedule Interview
          </button>
          
          {/* Export Profile button */}
          <button
            type="button"
            className="w-full inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
          >
            <DocumentTextIcon className="mr-2 h-4 w-4" aria-hidden="true" />
            Export Profile
          </button>
        </div>
        
        <div className="border-t border-gray-200 mt-4 pt-4">
          <div className="flex">
            <button
              type="button"
              onClick={toggleFavorite}
              className={`flex-1 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md 
                ${isFavorite 
                  ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100' 
                  : 'text-gray-700 bg-white hover:bg-gray-50'}`}
            >
              <StarIcon 
                className={`mr-2 h-4 w-4 ${isFavorite ? 'text-yellow-500 fill-yellow-500' : ''}`} 
                aria-hidden="true" 
              />
              {isFavorite ? 'Favorited' : 'Add to Favorites'}
            </button>
            
            <button
              type="button"
              className="flex-1 ml-3 inline-flex items-center justify-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
            >
              <ArchiveBoxIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              Archive
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CandidateActions;