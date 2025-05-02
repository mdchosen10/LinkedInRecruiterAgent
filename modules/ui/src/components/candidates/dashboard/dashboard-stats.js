import React from 'react';
import { useData } from '../../../contexts/data-context';

// Icons
import {
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  DocumentCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const DashboardStats = () => {
  const { candidates } = useData();
  
  // Calculate stats
  const stats = [
    {
      id: 1,
      name: 'Total Candidates',
      value: candidates.length,
      icon: UserGroupIcon,
      color: 'bg-blue-500',
    },
    {
      id: 2,
      name: 'Active Conversations',
      value: candidates.filter(c => c.status === 'contacted' || c.status === 'screening').length,
      icon: ChatBubbleLeftRightIcon,
      color: 'bg-green-500',
    },
    {
      id: 3,
      name: 'Interviews Scheduled',
      value: candidates.filter(c => c.status === 'interviewing').length,
      icon: ClockIcon,
      color: 'bg-purple-500',
    },
    {
      id: 4,
      name: 'New This Week',
      value: candidates.filter(c => c.status === 'new').length,
      icon: DocumentCheckIcon,
      color: 'bg-yellow-500',
    },
  ];
  
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.id}
          className="bg-white overflow-hidden shadow rounded-lg"
        >
          <div className="p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-md ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">
                      {stat.value}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <a
                href="#"
                className="font-medium text-linkedin-blue hover:text-linkedin-dark-blue"
              >
                View all
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DashboardStats;