import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Icons
import {
  HomeIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  Cog6ToothIcon,
  BellIcon,
  MagnifyingGlassIcon,
  ArrowRightStartOnRectangleIcon
} from '@heroicons/react/24/outline';

const MainLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    // In a real app, this would trigger a search in the current context
    console.log('Searching for:', searchQuery);
  };
  
  // Navigation items
  const navItems = [
    { 
      name: 'Dashboard', 
      path: '/', 
      icon: HomeIcon,
      exact: true
    },
    { 
      name: 'Candidates', 
      path: '/candidates', 
      icon: UserGroupIcon 
    },
    { 
      name: 'Messaging', 
      path: '/messaging', 
      icon: ChatBubbleLeftRightIcon 
    },
    { 
      name: 'Settings', 
      path: '/settings', 
      icon: Cog6ToothIcon 
    }
  ];

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 bg-white border-r border-gray-200">
            {/* Logo */}
            <div className="flex items-center h-16 flex-shrink-0 px-4 bg-linkedin-blue">
              <div className="text-xl text-white font-bold">LinkedIn Recruiter</div>
            </div>
            
            {/* Sidebar navigation */}
            <div className="flex-1 flex flex-col overflow-y-auto">
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navItems.map((item) => {
                  const isActive = item.exact 
                    ? location.pathname === item.path
                    : location.pathname.startsWith(item.path);
                    
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      className={({ isActive }) => 
                        `group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                          isActive 
                            ? 'bg-linkedin-lightest-blue text-linkedin-blue' 
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`
                      }
                    >
                      <item.icon 
                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                          isActive ? 'text-linkedin-blue' : 'text-gray-400 group-hover:text-gray-500'
                        }`} 
                        aria-hidden="true" 
                      />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
            
            {/* User profile */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-500">
                    <span className="text-sm font-medium leading-none text-white">
                      {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
                    </span>
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {currentUser?.name || 'User'}
                  </p>
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-xs font-medium text-gray-500 hover:text-linkedin-blue"
                  >
                    <ArrowRightStartOnRectangleIcon className="mr-1 h-4 w-4" />
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top header */}
        <div className="relative z-10 flex-shrink-0 flex h-16 bg-white shadow">
          {/* Mobile menu button */}
          <button
            type="button"
            className="md:hidden px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-linkedin-blue"
          >
            <span className="sr-only">Open sidebar</span>
            <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Search */}
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex">
              <form className="w-full flex md:ml-0" onSubmit={handleSearch}>
                <label htmlFor="search-field" className="sr-only">
                  Search
                </label>
                <div className="relative w-full text-gray-400 focus-within:text-gray-600">
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <input
                    id="search-field"
                    className="block w-full h-full pl-8 pr-3 py-2 border-transparent text-gray-900 placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-0 focus:border-transparent sm:text-sm"
                    placeholder="Search candidates, messages..."
                    type="search"
                    name="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </form>
            </div>
            
            {/* Notifications */}
            <div className="ml-4 flex items-center md:ml-6">
              <button
                type="button"
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-linkedin-blue"
              >
                <span className="sr-only">View notifications</span>
                <BellIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Page content goes here */}
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;