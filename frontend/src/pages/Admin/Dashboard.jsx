import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLoans: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    pendingLoans: 0,
    activeLoans: 0
  });
  const [recentLoans, setRecentLoans] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loanStats, setLoanStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [usersRes, loansRes, transactionsRes, userStatsRes, loanStatsRes] = await Promise.all([
        axios.get('/api/users?limit=5'),
        axios.get('/api/loans?limit=5'),
        axios.get('/api/transactions?limit=5'),
        axios.get('/api/auth/stats'),
        axios.get('/api/loans/stats')
      ]);

      setRecentUsers(usersRes.data.users);
      setRecentLoans(loansRes.data.loans);

      const userStats = userStatsRes.data.stats;
      const loanStatsData = loanStatsRes.data.stats;
      
      const pendingLoans = loanStatsData.byStatus.find(stat => stat._id === 'pending')?.count || 0;
      const activeLoans = loanStatsData.byStatus.find(stat => stat._id === 'active')?.count || 0;
      
      setLoanStats(loanStatsData.byStatus);

      // Calculate revenue from completed payment transactions
      const transactions = transactionsRes.data.transactions;
      const revenue = transactions
        .filter(t => t.type === 'payment' && t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        totalUsers: userStats.totalUsers,
        totalLoans: loanStatsData.overall.totalLoans,
        totalTransactions: transactions.length,
        totalRevenue: revenue,
        pendingLoans,
        activeLoans
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      active: 'bg-blue-100 text-blue-800',
      completed: 'bg-gray-100 text-gray-800',
      rejected: 'bg-red-100 text-red-800',
      defaulted: 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your loan management system administration panel.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">👥</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/admin/users" className="font-medium text-blue-600 hover:text-blue-500">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💰</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Loans</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalLoans}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/admin/loans" className="font-medium text-green-600 hover:text-green-500">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">💳</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Transactions</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalTransactions}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/admin/transactions" className="font-medium text-purple-600 hover:text-purple-500">
                View all
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">$</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${stats.totalRevenue.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/admin/reports" className="font-medium text-indigo-600 hover:text-indigo-500">
                View reports
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Status Overview */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Loan Status Overview</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {loanStats.map((stat) => (
              <div key={stat._id} className="text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${getStatusColor(stat._id)}`}>
                  <span className="text-lg font-semibold">{stat.count}</span>
                </div>
                <p className="mt-2 text-sm font-medium text-gray-900 capitalize">{stat._id}</p>
                <p className="text-sm text-gray-500">${stat.totalAmount?.toLocaleString() || 0}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentUsers.map((user) => (
              <Link
                key={user._id}
                to={`/admin/users/${user._id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-gray-600 font-medium text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          <div className="bg-gray-50 px-6 py-3">
            <Link
              to="/admin/users"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all users
            </Link>
          </div>
        </div>

        {/* Recent Loans */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Loans</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentLoans.map((loan) => (
              <Link
                key={loan._id}
                to={`/admin/loans/${loan._id}`}
                className="block px-6 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {loan.loanAccountNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {loan.user?.name} • {loan.loanType}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ${loan.loanAmount.toLocaleString()}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(loan.status)}`}>
                      {loan.status}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <div className="bg-gray-50 px-6 py-3">
            <Link
              to="/admin/loans"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all loans
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Link
              to="/admin/loans/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">➕</span>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Create Loan</h4>
                <p className="text-sm text-gray-500">Create new loan for user</p>
              </div>
            </Link>

            <Link
              to="/admin/users/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">👤</span>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Add User</h4>
                <p className="text-sm text-gray-500">Create new user account</p>
              </div>
            </Link>

            <Link
              to="/admin/transactions"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg">💳</span>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Transactions</h4>
                <p className="text-sm text-gray-500">Manage transactions</p>
              </div>
            </Link>

            <Link
              to="/admin/reports"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <span className="text-orange-600 text-lg">📊</span>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Reports</h4>
                <p className="text-sm text-gray-500">View system reports</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;