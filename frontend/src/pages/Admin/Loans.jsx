import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Loans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    loanType: '',
    search: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [users, setUsers] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchLoans();
    fetchUsers();
  }, [filters]);

  const fetchLoans = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });

      const response = await axios.get(`/api/loans?${params}`);
      setLoans(response.data.loans);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('/api/users?limit=100');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
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

  const handleStatusUpdate = async (loanId, newStatus) => {
    try {
      await axios.patch(`/api/loans/${loanId}/status`, { status: newStatus });
      fetchLoans(pagination.page);
    } catch (error) {
      console.error('Error updating loan status:', error);
      alert('Failed to update loan status');
    }
  };

  const CreateLoanModal = () => {
    const [formData, setFormData] = useState({
      userId: '',
      loanType: 'personal',
      loanAmount: '',
      interestRate: '',
      loanTerm: '',
      startDate: '',
      endDate: '',
      purpose: '',
      description: ''
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setCreateLoading(true);
      try {
        await axios.post('/api/loans', formData);
        setShowCreateModal(false);
        fetchLoans();
        // Reset form
        setFormData({
          userId: '',
          loanType: 'personal',
          loanAmount: '',
          interestRate: '',
          loanTerm: '',
          startDate: '',
          endDate: '',
          purpose: '',
          description: ''
        });
      } catch (error) {
        console.error('Error creating loan:', error);
        alert('Failed to create loan');
      } finally {
        setCreateLoading(false);
      }
    };

    const handleChange = (e) => {
      setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }));
    };

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Create New Loan</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">User</label>
                  <select
                    name="userId"
                    value={formData.userId}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select User</option>
                    {users.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Loan Type</label>
                  <select
                    name="loanType"
                    value={formData.loanType}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="personal">Personal</option>
                    <option value="home">Home</option>
                    <option value="car">Car</option>
                    <option value="business">Business</option>
                    <option value="education">Education</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Loan Amount</label>
                  <input
                    type="number"
                    name="loanAmount"
                    value={formData.loanAmount}
                    onChange={handleChange}
                    required
                    min="1000"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="interestRate"
                    value={formData.interestRate}
                    onChange={handleChange}
                    required
                    min="0.1"
                    max="50"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Loan Term (months)</label>
                  <input
                    type="number"
                    name="loanTerm"
                    value={formData.loanTerm}
                    onChange={handleChange}
                    required
                    min="1"
                    max="360"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose</label>
                <input
                  type="text"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {createLoading ? 'Creating...' : 'Create Loan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
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
        <h1 className="text-2xl font-bold text-gray-900">Loan Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Create Loan
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search loans..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="defaulted">Defaulted</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loan Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.loanType}
              onChange={(e) => handleFilterChange('loanType', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="personal">Personal</option>
              <option value="home">Home</option>
              <option value="car">Car</option>
              <option value="business">Business</option>
              <option value="education">Education</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', loanType: '', search: '' })}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Loans List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {loans.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {loans.map((loan) => (
              <li key={loan._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">L</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link
                          to={`/admin/loans/${loan._id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          {loan.loanAccountNumber}
                        </Link>
                        <div className="text-sm text-gray-500 capitalize">
                          {loan.user?.name} • {loan.loanType} Loan
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          ${loan.loanAmount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          Balance: ${loan.remainingBalance.toLocaleString()}
                        </div>
                      </div>
                      {getStatusBadge(loan.status)}
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <div className="flex items-center text-sm text-gray-500">
                        <span>Interest: {loan.interestRate}%</span>
                        <span className="mx-2">•</span>
                        <span>Term: {loan.loanTerm} months</span>
                        <span className="mx-2">•</span>
                        <span>Monthly: ${loan.monthlyPayment}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <div className="flex space-x-2">
                        <select
                          value={loan.status}
                          onChange={(e) => handleStatusUpdate(loan._id, e.target.value)}
                          className="text-xs border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                          <option value="active">Active</option>
                          <option value="completed">Completed</option>
                          <option value="defaulted">Defaulted</option>
                        </select>
                        <Link
                          to={`/admin/loans/${loan._id}`}
                          className="text-blue-600 hover:text-blue-500"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
            <p className="text-gray-500">
              {filters.status || filters.loanType || filters.search 
                ? 'Try changing your filters' 
                : 'Get started by creating your first loan'
              }
            </p>
            {!(filters.status || filters.loanType || filters.search) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Loan
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between items-center">
            <button
              onClick={() => fetchLoans(pagination.page - 1)}
              disabled={!pagination.hasPrev}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="text-sm text-gray-700">
              Page <span className="font-medium">{pagination.page}</span> of{' '}
              <span className="font-medium">{pagination.totalPages}</span>
            </div>
            <button
              onClick={() => fetchLoans(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Create Loan Modal */}
      {showCreateModal && <CreateLoanModal />}
    </div>
  );
}

export default Loans;