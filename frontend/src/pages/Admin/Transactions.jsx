import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    type: '',
    status: '',
    paymentMethod: '',
    search: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [loans, setLoans] = useState([]);
  const [users, setUsers] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);

  useEffect(() => {
    fetchTransactions();
    fetchLoans();
    fetchUsers();
  }, [filters]);

  const fetchTransactions = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...filters
      });

      const response = await axios.get(`/api/transactions?${params}`);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    try {
      const response = await axios.get('/api/loans?limit=100');
      setLoans(response.data.loans);
    } catch (error) {
      console.error('Error fetching loans:', error);
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
      completed: { color: 'bg-green-100 text-green-800', label: 'Completed' },
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
      failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
      refunded: { color: 'bg-gray-100 text-gray-800', label: 'Refunded' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getTypeBadge = (type) => {
    const typeConfig = {
      payment: { color: 'bg-blue-100 text-blue-800', label: 'Payment' },
      disbursement: { color: 'bg-green-100 text-green-800', label: 'Disbursement' },
      refund: { color: 'bg-orange-100 text-orange-800', label: 'Refund' }
    };

    const config = typeConfig[type] || typeConfig.payment;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const handleStatusUpdate = async (transactionId, newStatus) => {
    try {
      await axios.put(`/api/transactions/${transactionId}`, { status: newStatus });
      fetchTransactions(pagination.page);
    } catch (error) {
      console.error('Error updating transaction status:', error);
      alert('Failed to update transaction status');
    }
  };

  const handleEdit = (transaction) => {
    setSelectedTransaction(transaction);
    setShowEditModal(true);
  };

  const handleDelete = async (transactionId, transactionNumber) => {
    if (window.confirm(`Are you sure you want to delete transaction "${transactionNumber}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`/api/transactions/${transactionId}`);
        fetchTransactions(pagination.page);
        alert('Transaction deleted successfully');
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Failed to delete transaction');
      }
    }
  };

  // Create Transaction Modal
  const CreateTransactionModal = () => {
    const [formData, setFormData] = useState({
      loanId: '',
      userId: '',
      amount: '',
      type: 'payment',
      paymentMethod: 'bank_transfer',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0]
    });

    const handleSubmit = async (e) => {
      e.preventDefault();
      setCreateLoading(true);
      try {
        await axios.post('/api/transactions', formData);
        setShowCreateModal(false);
        fetchTransactions();
        // Reset form
        setFormData({
          loanId: '',
          userId: '',
          amount: '',
          type: 'payment',
          paymentMethod: 'bank_transfer',
          description: '',
          transactionDate: new Date().toISOString().split('T')[0]
        });
      } catch (error) {
        console.error('Error creating transaction:', error);
        alert('Failed to create transaction');
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
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Create New Transaction</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Loan</label>
                  <select
                    name="loanId"
                    value={formData.loanId}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="">Select Loan</option>
                    {loans.map(loan => (
                      <option key={loan._id} value={loan._id}>
                        {loan.loanAccountNumber} - {loan.user?.name} (${loan.loanAmount})
                      </option>
                    ))}
                  </select>
                </div>

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
                  <label className="block text-sm font-medium text-gray-700">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleChange}
                    required
                    min="1"
                    step="0.01"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="payment">Payment</option>
                    <option value="disbursement">Disbursement</option>
                    <option value="refund">Refund</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                  <select
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="cashfree">Cashfree</option>
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="card">Card</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Transaction Date</label>
                  <input
                    type="date"
                    name="transactionDate"
                    value={formData.transactionDate}
                    onChange={handleChange}
                    required
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Optional description for this transaction"
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
                  {createLoading ? 'Creating...' : 'Create Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // Edit Transaction Modal
  const EditTransactionModal = () => {
    const [formData, setFormData] = useState({
      status: '',
      paymentMethod: '',
      description: ''
    });

    useEffect(() => {
      if (selectedTransaction) {
        setFormData({
          status: selectedTransaction.status,
          paymentMethod: selectedTransaction.paymentMethod,
          description: selectedTransaction.description || ''
        });
      }
    }, [selectedTransaction]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setEditLoading(true);
      try {
        await axios.put(`/api/transactions/${selectedTransaction._id}`, formData);
        setShowEditModal(false);
        setSelectedTransaction(null);
        fetchTransactions(pagination.page);
        alert('Transaction updated successfully');
      } catch (error) {
        console.error('Error updating transaction:', error);
        alert('Failed to update transaction');
      } finally {
        setEditLoading(false);
      }
    };

    const handleChange = (e) => {
      setFormData(prev => ({
        ...prev,
        [e.target.name]: e.target.value
      }));
    };

    if (!selectedTransaction) return null;

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Edit Transaction
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              {selectedTransaction.transactionId}
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  name="paymentMethod"
                  value={formData.paymentMethod}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cashfree">Cashfree</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="card">Card</option>
                </select>
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
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedTransaction(null);
                  }}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:opacity-50"
                >
                  {editLoading ? 'Updating...' : 'Update Transaction'}
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
        <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        >
          Create Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              placeholder="Search transactions..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="">All Types</option>
              <option value="payment">Payment</option>
              <option value="disbursement">Disbursement</option>
              <option value="refund">Refund</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ type: '', status: '', paymentMethod: '', search: '' })}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white shadow overflow-hidden sm:rounded-md">
        {transactions.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
              <li key={transaction._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'payment' ? 'bg-green-100' : 
                          transaction.type === 'disbursement' ? 'bg-blue-100' : 'bg-orange-100'
                        }`}>
                          <span className={`text-sm font-medium ${
                            transaction.type === 'payment' ? 'text-green-600' : 
                            transaction.type === 'disbursement' ? 'text-blue-600' : 'text-orange-600'
                          }`}>
                            {transaction.type === 'payment' ? 'P' : 
                             transaction.type === 'disbursement' ? 'D' : 'R'}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {transaction.transactionId}
                        </div>
                        <div className="text-sm text-gray-500">
                          <Link 
                            to={`/admin/users/${transaction.user._id}`}
                            className="text-blue-600 hover:text-blue-500"
                          >
                            {transaction.user.name}
                          </Link>
                          {' • '}
                          <Link 
                            to={`/admin/loans/${transaction.loan._id}`}
                            className="text-blue-600 hover:text-blue-500"
                          >
                            {transaction.loan.loanAccountNumber}
                          </Link>
                          {' • '}
                          {new Date(transaction.transactionDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          transaction.type === 'payment' ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          ${transaction.amount.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {transaction.paymentMethod?.replace('_', ' ')}
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <div className="flex space-x-1">
                          {getTypeBadge(transaction.type)}
                          {getStatusBadge(transaction.status)}
                        </div>
                        <div className="flex space-x-2">
                          <select
                            value={transaction.status}
                            onChange={(e) => handleStatusUpdate(transaction._id, e.target.value)}
                            className="text-xs border border-gray-300 rounded px-2 py-1"
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-xs bg-yellow-100 text-yellow-800 hover:bg-yellow-200 px-2 py-1 rounded"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(transaction._id, transaction.transactionId)}
                            className="text-xs bg-red-100 text-red-800 hover:bg-red-200 px-2 py-1 rounded"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  {transaction.description && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">{transaction.description}</p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💳</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
            <p className="text-gray-500">
              {filters.type || filters.status || filters.search 
                ? 'Try changing your filters' 
                : 'Get started by creating your first transaction'
              }
            </p>
            {!(filters.type || filters.status || filters.search) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Create Transaction
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
              onClick={() => fetchTransactions(pagination.page - 1)}
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
              onClick={() => fetchTransactions(pagination.page + 1)}
              disabled={!pagination.hasNext}
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && <CreateTransactionModal />}
      {showEditModal && <EditTransactionModal />}
    </div>
  );
}

export default Transactions;