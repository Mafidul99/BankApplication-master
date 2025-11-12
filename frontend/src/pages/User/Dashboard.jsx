import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Dashboard() {
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalPaid: 0,
    pendingLoans: 0
  });
  const [recentLoans, setRecentLoans] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [loansRes, transactionsRes, statsRes] = await Promise.all([
        axios.get('/api/loans?limit=5'),
        axios.get('/api/transactions?limit=5'),
        axios.get('/api/loans/stats')
      ]);

      setRecentLoans(loansRes.data.loans);
      setRecentTransactions(transactionsRes.data.transactions);
      
      const loanStats = statsRes.data.stats.overall;
      const statusStats = statsRes.data.stats.byStatus;
      
      const activeLoans = statusStats.find(stat => stat._id === 'active')?.count || 0;
      const pendingLoans = statusStats.find(stat => stat._id === 'pending')?.count || 0;

      setStats({
        totalLoans: loanStats.totalLoans || 0,
        activeLoans,
        totalPaid: loanStats.totalLoanAmount - loanStats.totalRemainingBalance || 0,
        pendingLoans
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
        <p className="text-gray-600 mt-2">Here's what's happening with your loans today.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">L</span>
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
              <Link to="/dashboard/loans" className="font-medium text-blue-600 hover:text-blue-500">
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
                  <span className="text-white text-sm font-bold">A</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active Loans</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.activeLoans}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/dashboard/loans?status=active" className="font-medium text-green-600 hover:text-green-500">
                View active
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">P</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Pending Loans</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.pendingLoans}</dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/dashboard/loans?status=pending" className="font-medium text-yellow-600 hover:text-yellow-500">
                View pending
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">$</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Paid</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    ${stats.totalPaid.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/dashboard/transactions" className="font-medium text-purple-600 hover:text-purple-500">
                View transactions
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Loans */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Loans</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentLoans.length > 0 ? (
              recentLoans.map((loan) => (
                <div key={loan._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {loan.loanAccountNumber}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {loan.loanType} • ${loan.loanAmount.toLocaleString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      loan.status === 'approved' ? 'bg-green-100 text-green-800' :
                      loan.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      loan.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {loan.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                No loans found
              </div>
            )}
          </div>
          <div className="bg-gray-50 px-6 py-3">
            <Link
              to="/dashboard/loans"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all loans
            </Link>
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.transactionId}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {transaction.type} • ${transaction.amount.toLocaleString()}
                      </p>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.status === 'completed' ? 'bg-green-100 text-green-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {transaction.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-4 text-center text-gray-500">
                No transactions found
              </div>
            )}
          </div>
          <div className="bg-gray-50 px-6 py-3">
            <Link
              to="/dashboard/transactions"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              View all transactions
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              to="/dashboard/loans"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <span className="text-blue-600 text-lg">💰</span>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">View Loans</h4>
                <p className="text-sm text-gray-500">Check your loan applications</p>
              </div>
            </Link>

            <Link
              to="/dashboard/transactions"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <span className="text-green-600 text-lg">💳</span>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Transactions</h4>
                <p className="text-sm text-gray-500">View payment history</p>
              </div>
            </Link>

            <Link
              to="/dashboard/profile"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors"
            >
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <span className="text-purple-600 text-lg">👤</span>
                </div>
              </div>
              <div className="ml-4">
                <h4 className="text-sm font-medium text-gray-900">Profile</h4>
                <p className="text-sm text-gray-500">Update your information</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;