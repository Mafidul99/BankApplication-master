import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';

function Sidebar({ sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    setSidebarOpen(false);
  };

  const adminNavigation = [
    { name: 'Dashboard', href: '/admin', icon: '📊', description: 'Overview and analytics' },
    { name: 'Loans', href: '/admin/loans', icon: '💰', description: 'Manage all loans' },
    { name: 'Transactions', href: '/admin/transactions', icon: '💳', description: 'Transaction history' },
    { name: 'Users', href: '/admin/users', icon: '👥', description: 'User management' },
    { name: 'Reports', href: '/admin/reports', icon: '📈', description: 'Analytics & reports' },
  ];

  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', description: 'Your overview' },
    { name: 'My Loans', href: '/dashboard/loans', icon: '💰', description: 'Your loan applications' },
    { name: 'Transactions', href: '/dashboard/transactions', icon: '💳', description: 'Payment history' }
  ];

  const settingsNavigation = [
    { name: 'Profile', href: user?.role === 'admin' ? '/admin/profile' : '/dashboard/profile', icon: '👤' },
    { name: 'Settings', href: user?.role === 'admin' ? '/admin/settings' : '/dashboard/settings', icon: '⚙️' },
  ];

  const navigation = user?.role === 'admin' ? adminNavigation : userNavigation;

  return (
    <>
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 flex z-40 md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">L</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">LoanManager</h1>
                    <p className="text-xs text-gray-500 capitalize">{user?.role} Panel</p>
                  </div>
                </div>
              </div>
              <nav className="mt-8 px-2 space-y-1">
                {/* Main Navigation */}
                <div className="mb-6">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Main Navigation
                  </h3>
                  <div className="mt-2 space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-2 py-3 text-base font-medium rounded-md transition-colors ${
                          isActive(item.href)
                            ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="mr-4 text-lg">{item.icon}</span>
                        <div className="flex-1">
                          <div>{item.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Settings Navigation */}
                <div className="mb-6">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Account
                  </h3>
                  <div className="mt-2 space-y-1">
                    {settingsNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors ${
                          isActive(item.href)
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                        onClick={() => setSidebarOpen(false)}
                      >
                        <span className="mr-4 text-lg">{item.icon}</span>
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Logout Button */}
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="group flex items-center w-full px-2 py-2 text-base font-medium text-red-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors"
                  >
                    <svg className="mr-4 h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </nav>
            </div>

            {/* User info at bottom */}
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center">
                <div className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                  <p className="text-xs font-medium text-gray-500 capitalize">{user?.role}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col flex-grow border-r border-gray-200 bg-white overflow-y-auto">
            {/* Header */}
            <div className="flex items-center flex-shrink-0 px-4 py-5">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">L</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">LoanManager</h1>
                  <p className="text-xs text-gray-500 capitalize">{user?.role} Panel</p>
                </div>
              </div>
            </div>

            {/* Main Navigation */}
            <div className="flex-grow flex flex-col">
              <nav className="flex-1 px-2 bg-white space-y-1">
                <div className="mb-6">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Main Navigation
                  </h3>
                  <div className="mt-2 space-y-1">
                    {navigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-2 py-3 text-sm font-medium rounded-md transition-colors ${
                          isActive(item.href)
                            ? 'bg-blue-100 text-blue-900 border-r-2 border-blue-500'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        <div className="flex-1">
                          <div>{item.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Settings Navigation */}
                <div className="mb-6">
                  <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Account
                  </h3>
                  <div className="mt-2 space-y-1">
                    {settingsNavigation.map((item) => (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                          isActive(item.href)
                            ? 'bg-gray-100 text-gray-900'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </nav>
            </div>

            {/* User info and logout */}
            <div className="flex-shrink-0 border-t border-gray-200">
              <div className="px-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U'}
                      </span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="ml-3 flex-shrink-0 p-1 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                    title="Sign out"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Sidebar;