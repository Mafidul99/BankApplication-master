import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function UserDetails() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loans, setLoans] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchUserDetails();
  }, [id]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const [userRes, loansRes, transactionsRes] = await Promise.all([
        axios.get(`/api/users/${id}`),
        axios.get(`/api/users/${id}/loans`),
        axios.get(`/api/users/${id}/transactions`)
      ]);

      setUser(userRes.data.user);
      setLoans(loansRes.data.loans);
      setTransactions(transactionsRes.data.transactions);
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleUpdate = async (newRole) => {
    try {
      await axios.put(`/api/users/${id}/role`, { role: newRole });
      fetchUserDetails();
      alert('User role updated successfully');
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Failed to update user role');
    }
  };

  const handleStatusToggle = async () => {
    try {
      if (user.isActive) {
        await axios.patch(`/api/users/${id}/deactivate`);
      } else {
        await axios.patch(`/api/users/${id}/activate`);
      }
      fetchUserDetails();
      alert(`User ${user.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert('Failed to update user status');
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      active: { color: 'bg-blue-100 text-blue-800', label: 'Active' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Completed' },
      defaulted: { color: 'bg-red-100 text-red-800', label: 'Defaulted' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">User Not Found</h1>
        <p className="text-gray-500 mt-2">The requested user could not be found.</p>
        <Link to="/admin/users" className="text-blue-600 hover:text-blue-500 mt-4 inline-block">
          Back to Users
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link to="/admin/users" className="text-blue-600 hover:text-blue-500 mb-4 inline-block">
            ← Back to Users
          </Link>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-gray-600 font-medium text-xl">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={user.role}
            onChange={(e) => handleRoleUpdate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={handleStatusToggle}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              user.isActive
                ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                : 'bg-green-100 text-green-800 hover:bg-green-200'
            }`}
          >
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">💰</span>
              </div>
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Loans</dt>
              <dd className="text-lg font-medium text-gray-900">{user.stats?.loans.totalLoans || 0}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">📈</span>
              </div>
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Active Loans</dt>
              <dd className="text-lg font-medium text-gray-900">{user.stats?.loans.activeLoans || 0}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">💳</span>
              </div>
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Transactions</dt>
              <dd className="text-lg font-medium text-gray-900">{user.stats?.transactions.totalTransactions || 0}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-bold">$</span>
              </div>
            </div>
            <div className="ml-4">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Paid</dt>
              <dd className="text-lg font-medium text-gray-900">
                ${user.stats?.transactions.totalPayments?.toLocaleString() || 0}
              </dd>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'loans', 'transactions'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="text-sm text-gray-900">{user.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="text-sm text-gray-900">{user.phone}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Role</dt>
                <dd className="text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user.role}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Member Since</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(user.createdAt).toLocaleDateString()}
                </dd>
              </div>
              {user.address && (user.address.street || user.address.city || user.address.state || user.address.zipCode) && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="text-sm text-gray-900">
                    {[user.address.street, user.address.city, user.address.state, user.address.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Loan Summary */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Summary</h3>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Loan Amount</dt>
                <dd className="text-sm text-gray-900">
                  ${user.stats?.loans.totalLoanAmount?.toLocaleString() || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Remaining Balance</dt>
                <dd className="text-sm text-gray-900">
                  ${user.stats?.loans.totalRemainingBalance?.toLocaleString() || 0}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Active Loans</dt>
                <dd className="text-sm text-gray-900">{user.stats?.loans.activeLoans || 0}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Payments</dt>
                <dd className="text-sm text-gray-900">
                  ${user.stats?.transactions.totalPayments?.toLocaleString() || 0}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'loans' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">User Loans</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {loans.length > 0 ? (
              loans.map((loan) => (
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
                      <p className="text-sm text-gray-500 capitalize">
                        {loan.loanType} • ${loan.loanAmount.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        Balance: ${loan.remainingBalance.toLocaleString()}
                      </p>
                      {getStatusBadge(loan.status)}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No loans found for this user
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">User Transactions</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div key={transaction._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.transactionId}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {transaction.type} • {new Date(transaction.transactionDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-500">
                        Loan: {transaction.loan?.loanAccountNumber}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        ${transaction.amount.toLocaleString()}
                      </p>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {transaction.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No transactions found for this user
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDetails;