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
    { name: 'Payments', href: '/admin/payments', icon: '💵', description: 'Manage payments' },
    { name: 'Users', href: '/admin/users', icon: '👥', description: 'User management' },
    { name: 'Reports', href: '/admin/reports', icon: '📈', description: 'Analytics & reports' },
  ];

  const userNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: '📊', description: 'Your overview' },
    { name: 'My Loans', href: '/dashboard/loans', icon: '💰', description: 'Your loan applications' },
    { name: 'Transactions', href: '/dashboard/transactions', icon: '💳', description: 'Payment history' },
    { name: 'Make Payment', href: '/dashboard/make-payment', icon: '💵', description: 'Make a new payment' },
    { name: 'Payment History', href: '/dashboard/payment-history', icon: '📋', description: 'View your payment history' }
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
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex flex-col flex-1 w-full max-w-xs bg-white">
            <div className="absolute top-0 right-0 pt-2 -mr-12">
              <button
                className="flex items-center justify-center w-10 h-10 ml-1 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                    <span className="text-sm font-bold text-white">L</span>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">LoanManager</h1>
                    <p className="text-xs text-gray-500 capitalize">{user?.role} Panel</p>
                  </div>
                </div>
              </div>
              <nav className="px-2 mt-8 space-y-1">
                {/* Main Navigation */}
                <div className="mb-6">
                  <h3 className="px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
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
                          <div className="mt-1 text-xs text-gray-500">{item.description}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Settings Navigation */}
                <div className="mb-6">
                  <h3 className="px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
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
                <div className="pt-6 mt-8 border-t border-gray-200">
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-2 py-2 text-base font-medium text-red-600 transition-colors rounded-md group hover:bg-red-50 hover:text-red-700"
                  >
                    <svg className="w-6 h-6 mr-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </nav>
            </div>

            {/* User info at bottom */}
            <div className="flex flex-shrink-0 p-4 border-t border-gray-200">
              <div className="flex items-center">
                <div className="flex items-center justify-center rounded-full h-9 w-9 bg-gradient-to-r from-blue-500 to-purple-600">
                  <span className="text-sm font-medium text-white">
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
          <div className="flex flex-col flex-grow overflow-y-auto bg-white border-r border-gray-200">
            {/* Header */}
            <div className="flex items-center flex-shrink-0 px-4 py-5">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                  <span className="text-sm font-bold text-white">L</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">LoanManager</h1>
                  <p className="text-xs text-gray-500 capitalize">{user?.role} Panel</p>
                </div>
              </div>
            </div>

            {/* Main Navigation */}
            <div className="flex flex-col flex-grow">
              <nav className="flex-1 px-2 space-y-1 bg-white">
                <div className="mb-6">
                  <h3 className="px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
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
                          <div className="mt-1 text-xs text-gray-500">{item.description}</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Settings Navigation */}
                <div className="mb-6">
                  <h3 className="px-3 text-xs font-semibold tracking-wider text-gray-500 uppercase">
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
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600">
                      <span className="text-sm font-medium text-white">
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
                    className="flex-shrink-0 p-1 ml-3 text-gray-400 transition-colors rounded-md hover:text-red-500"
                    title="Sign out"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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