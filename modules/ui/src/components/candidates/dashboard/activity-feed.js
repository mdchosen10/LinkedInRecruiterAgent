import React from 'react';
import { Link } from 'react-router-dom';

// Sample activity data (would come from API in production)
const sampleActivities = [
  {
    id: 1,
    type: 'message',
    description: 'You sent a message to Alex Johnson',
    timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    target: { id: '1', name: 'Alex Johnson' }
  },
  {
    id: 2,
    type: 'evaluation',
    description: 'You updated evaluation for Samantha Lee',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    target: { id: '2', name: 'Samantha Lee' }
  },
  {
    id: 3,
    type: 'status',
    description: 'You changed Michael Chen\'s status to Interviewing',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    target: { id: '3', name: 'Michael Chen' }
  },
  {
    id: 4,
    type: 'note',
    description: 'You added a note to Emily Rodriguez',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    target: { id: '4', name: 'Emily Rodriguez' }
  },
  {
    id: 5,
    type: 'candidate',
    description: 'You added David Kim as a new candidate',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    target: { id: '5', name: 'David Kim' }
  }
];

// Activity icon component
const ActivityIcon = ({ type }) => {
  let iconClass = '';
  
  switch (type) {
    case 'message':
      iconClass = 'bg-blue-100 text-blue-500';
      return (
        <div className={`p-2 rounded-full ${iconClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
            <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
          </svg>
        </div>
      );
    case 'evaluation':
      iconClass = 'bg-green-100 text-green-500';
      return (
        <div className={`p-2 rounded-full ${iconClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'status':
      iconClass = 'bg-purple-100 text-purple-500';
      return (
        <div className={`p-2 rounded-full ${iconClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M5 4a1 1 0 00-2 0v7.268a2 2 0 000 3.464V16a1 1 0 102 0v-1.268a2 2 0 000-3.464V4zM11 4a1 1 0 10-2 0v1.268a2 2 0 000 3.464V16a1 1 0 102 0V8.732a2 2 0 000-3.464V4zM16 3a1 1 0 011 1v7.268a2 2 0 010 3.464V16a1 1 0 11-2 0v-1.268a2 2 0 010-3.464V4a1 1 0 011-1z" />
          </svg>
        </div>
      );
    case 'note':
      iconClass = 'bg-yellow-100 text-yellow-500';
      return (
        <div className={`p-2 rounded-full ${iconClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
          </svg>
        </div>
      );
    case 'candidate':
      iconClass = 'bg-indigo-100 text-indigo-500';
      return (
        <div className={`p-2 rounded-full ${iconClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
          </svg>
        </div>
      );
    default:
      iconClass = 'bg-gray-100 text-gray-500';
      return (
        <div className={`p-2 rounded-full ${iconClass}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        </div>
      );
  }
};

// Format relative time
const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 0) {
    return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
  } else if (diffHour > 0) {
    return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  } else if (diffMin > 0) {
    return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  } else {
    return 'Just now';
  }
};

const ActivityFeed = () => {
  return (
    <div className="flow-root">
      <ul className="-mb-8">
        {sampleActivities.map((activity, activityIdx) => (
          <li key={activity.id}>
            <div className="relative pb-8">
              {activityIdx !== sampleActivities.length - 1 ? (
                <span
                  className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex items-start space-x-3">
                <div className="relative">
                  <ActivityIcon type={activity.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <div>
                    <div className="text-sm text-gray-500">
                      {activity.description}{' '}
                      <Link 
                        to={`/candidates/${activity.target.id}`}
                        className="font-medium text-gray-900 hover:text-linkedin-blue"
                      >
                        {activity.target.name}
                      </Link>
                    </div>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActivityFeed;