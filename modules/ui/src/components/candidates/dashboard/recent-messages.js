import React from 'react';
import { Link } from 'react-router-dom';

// Sample messages data (would come from API in production)
const sampleMessages = [
  {
    id: 1,
    candidateId: '1',
    candidateName: 'Alex Johnson',
    candidatePhoto: 'https://randomuser.me/api/portraits/men/32.jpg',
    subject: 'Opportunity at Your Company',
    preview: "Hi Alex, I hope this message finds you well. I'm reaching out because your profile caught my attention...",
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
    status: 'sent',
  },
  {
    id: 2,
    candidateId: '2',
    candidateName: 'Samantha Lee',
    candidatePhoto: 'https://randomuser.me/api/portraits/women/44.jpg',
    subject: 'Following up on my previous message',
    preview: 'Hi Samantha, I wanted to follow up on my previous message about the UX/UI Designer role at Your Company...',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    status: 'read',
  },
  {
    id: 3,
    candidateId: '3',
    candidateName: 'Michael Chen',
    candidatePhoto: 'https://randomuser.me/api/portraits/men/67.jpg',
    subject: 'Interview Invitation - Data Scientist at Your Company',
    preview: 'Hi Michael, Thank you for your interest in the Data Scientist position at Your Company. After reviewing your profile...',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
    status: 'replied',
  },
  {
    id: 4,
    candidateId: '6',
    candidateName: 'Sarah Williams',
    candidatePhoto: 'https://randomuser.me/api/portraits/women/65.jpg',
    subject: 'Opportunity at Your Company',
    preview: "Hi Sarah, I hope this message finds you well. I'm reaching out because your experience with React caught my attention...",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    status: 'sent',
  }
];

// Format relative time
const formatRelativeTime = (timestamp) => {
  const now = new Date();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffDay > 0) {
    return diffDay === 1 ? 'Yesterday' : `${diffDay}d ago`;
  } else if (diffHour > 0) {
    return `${diffHour}h ago`;
  } else if (diffMin > 0) {
    return `${diffMin}m ago`;
  } else {
    return 'Just now';
  }
};

// Status badge component
const StatusBadge = ({ status }) => {
  let colorClass = '';
  let label = '';
  
  switch (status) {
    case 'sent':
      colorClass = 'bg-blue-100 text-blue-800';
      label = 'Sent';
      break;
    case 'read':
      colorClass = 'bg-green-100 text-green-800';
      label = 'Read';
      break;
    case 'replied':
      colorClass = 'bg-purple-100 text-purple-800';
      label = 'Replied';
      break;
    default:
      colorClass = 'bg-gray-100 text-gray-800';
      label = status.charAt(0).toUpperCase() + status.slice(1);
  }
  
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${colorClass}`}>
      {label}
    </span>
  );
};

const RecentMessages = () => {
  return (
    <div className="flow-root">
      <ul className="divide-y divide-gray-200">
        {sampleMessages.map((message) => (
          <li key={message.id} className="py-3">
            <div className="flex items-start space-x-3">
              {/* Candidate photo */}
              <div className="flex-shrink-0">
                {message.candidatePhoto ? (
                  <img
                    className="h-10 w-10 rounded-full object-cover"
                    src={message.candidatePhoto}
                    alt={message.candidateName}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-linkedin-blue flex items-center justify-center">
                    <span className="text-white font-medium">
                      {message.candidateName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Message content */}
              <div className="flex-1 min-w-0">
                <Link
                  to={`/candidates/${message.candidateId}`}
                  className="text-sm font-medium text-gray-900 hover:text-linkedin-blue"
                >
                  {message.candidateName}
                </Link>
                <p className="text-sm text-gray-900 font-medium">
                  {message.subject}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {message.preview}
                </p>
                <div className="mt-1 flex items-center">
                  <StatusBadge status={message.status} />
                  <span className="text-xs text-gray-500 ml-2">
                    {formatRelativeTime(message.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      
      {/* View all link */}
      <div className="mt-4 text-center">
        <Link 
          to="/messaging"
          className="text-sm font-medium text-linkedin-blue hover:text-linkedin-dark-blue"
        >
          View all messages
        </Link>
      </div>
    </div>
  );
};

export default RecentMessages;