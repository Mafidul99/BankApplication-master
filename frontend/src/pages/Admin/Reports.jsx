import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Reports() {
  const [reports, setReports] = useState({
    userStats: null,
    loanStats: null,
    transactionStats: null
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const [userStatsRes, loanStatsRes, transactionStatsRes] = await Promise.all([
        axios.get('/api/auth/stats'),
        axios.get('/api/loans/stats'),
        axios.get('/api/transactions/stats')
      ]);

      setReports({
        userStats: userStatsRes.data.stats,
        loanStats: loanStatsRes.data.stats,
        transactionStats: transactionStatsRes.data.stats
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeChange = (e) => {
    setDateRange(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleGenerateReport = () => {
    // Implement date-based report generation
    console.log('Generate report for:', dateRange);
    // You would typically make API calls with date filters here
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Custom Report</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateRangeChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateRangeChange}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleGenerateReport}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* User Statistics */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">User Statistics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {reports.userStats?.totalUsers || 0}
              </div>
              <div className="text-sm text-gray-500">Total Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {reports.userStats?.totalAdmins || 0}
              </div>
              <div className="text-sm text-gray-500">Admins</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {reports.userStats?.totalRegularUsers || 0}
              </div>
              <div className="text-sm text-gray-500">Regular Users</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {reports.userStats?.newUsersLast30Days || 0}
              </div>
              <div className="text-sm text-gray-500">New Users (30 days)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Loan Statistics */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Loan Statistics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {reports.loanStats?.overall.totalLoans || 0}
              </div>
              <div className="text-sm text-gray-500">Total Loans</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${reports.loanStats?.overall.totalLoanAmount?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500">Total Loan Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${reports.loanStats?.overall.totalRemainingBalance?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500">Remaining Balance</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {reports.loanStats?.overall.avgInterestRate?.toFixed(2) || 0}%
              </div>
              <div className="text-sm text-gray-500">Avg Interest Rate</div>
            </div>
          </div>

          {/* Loan Status Breakdown */}
          <h4 className="text-md font-medium text-gray-900 mb-4">Loan Status Breakdown</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {reports.loanStats?.byStatus.map((stat) => (
              <div key={stat._id} className="text-center bg-gray-50 rounded-lg p-4">
                <div className="text-lg font-bold text-gray-900">{stat.count}</div>
                <div className="text-sm text-gray-500 capitalize">{stat._id}</div>
                <div className="text-xs text-gray-400">
                  ${stat.totalAmount?.toLocaleString() || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Statistics */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Transaction Statistics</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {reports.transactionStats?.overall.totalTransactions || 0}
              </div>
              <div className="text-sm text-gray-500">Total Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${reports.transactionStats?.overall.totalAmount?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${reports.transactionStats?.overall.avgTransactionAmount?.toFixed(2) || 0}
              </div>
              <div className="text-sm text-gray-500">Avg Transaction</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {reports.transactionStats?.byType.find(t => t._id === 'payment')?.count || 0}
              </div>
              <div className="text-sm text-gray-500">Payments</div>
            </div>
          </div>

          {/* Transaction Type Breakdown */}
          <h4 className="text-md font-medium text-gray-900 mb-4">Transaction Type Breakdown</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reports.transactionStats?.byType.map((type) => (
              <div key={type._id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 capitalize">{type._id}</span>
                  <span className="text-lg font-bold text-blue-600">{type.count}</span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  Total: ${type.totalAmount?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-gray-400">
                  Avg: ${type.avgAmount?.toFixed(2) || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Export */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Export Reports</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <div className="text-center">
                <div className="text-blue-600 text-2xl mb-2">📊</div>
                <div className="text-sm font-medium text-gray-900">Export User Report</div>
                <div className="text-xs text-gray-500">CSV Format</div>
              </div>
            </button>
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
              <div className="text-center">
                <div className="text-green-600 text-2xl mb-2">💰</div>
                <div className="text-sm font-medium text-gray-900">Export Loan Report</div>
                <div className="text-xs text-gray-500">CSV Format</div>
              </div>
            </button>
            <button className="flex items-center justify-center p-4 border border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
              <div className="text-center">
                <div className="text-purple-600 text-2xl mb-2">💳</div>
                <div className="text-sm font-medium text-gray-900">Export Transaction Report</div>
                <div className="text-xs text-gray-500">CSV Format</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reports;