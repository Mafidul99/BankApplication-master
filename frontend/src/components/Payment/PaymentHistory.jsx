import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// eslint-disable-next-line no-unused-vars
function PaymentHistory({ payments = [], onEdit, onDelete, onRefresh }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [filteredPayments, setFilteredPayments] = useState(payments);
  const [filters, setFilters] = useState({
    status: '',
    paymentMethod: '',
    search: ''
  });

  useEffect(() => {
    setFilteredPayments(payments);
  }, [payments]);

  useEffect(() => {
    filterPayments();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, payments]);

  const filterPayments = () => {
    let filtered = payments;

    if (filters.status) {
      filtered = filtered.filter(payment => payment.status === filters.status);
    }

    if (filters.paymentMethod) {
      filtered = filtered.filter(payment => payment.paymentMethod === filters.paymentMethod);
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(payment =>
        payment.transactionId.toLowerCase().includes(searchLower) ||
        payment.loan?.loanAccountNumber.toLowerCase().includes(searchLower) ||
        (user.role === 'admin' && payment.user?.name.toLowerCase().includes(searchLower))
      );
    }

    setFilteredPayments(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleStatusUpdate = async (paymentId, newStatus) => {
    try {
      setLoading(true);
      await axios.put(`/api/transactions/${paymentId}`, { status: newStatus });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Failed to update payment status');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (paymentId) => {
    if (window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      try {
        setLoading(true);
        await axios.delete(`/api/transactions/${paymentId}`);
        if (onRefresh) onRefresh();
      } catch (error) {
        console.error('Error deleting payment:', error);
        alert('Failed to delete payment');
      } finally {
        setLoading(false);
      }
    }
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

  const getPaymentMethodBadge = (method) => {
    const methodConfig = {
      cashfree: { color: 'bg-blue-100 text-blue-800', label: 'Cashfree' },
      bank_transfer: { color: 'bg-green-100 text-green-800', label: 'Bank Transfer' },
      card: { color: 'bg-purple-100 text-purple-800', label: 'Card' },
      cash: { color: 'bg-gray-100 text-gray-800', label: 'Cash' },
      check: { color: 'bg-orange-100 text-orange-800', label: 'Check' }
    };

    const config = methodConfig[method] || methodConfig.cashfree;
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading && payments.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-b-2 border-blue-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="p-4 bg-white rounded-lg shadow">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              placeholder="Search payments..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Status</label>
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
          <div>
            <label className="block mb-1 text-sm font-medium text-gray-700">Payment Method</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            >
              <option value="">All Methods</option>
              <option value="cashfree">Cashfree</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setFilters({ status: '', paymentMethod: '', search: '' })}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Payments List */}
      <div className="overflow-hidden bg-white shadow sm:rounded-md">
        {filteredPayments.length > 0 ? (
          <ul className="divide-y divide-gray-200">
            {filteredPayments.map((payment) => (
              <li key={payment._id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                          <span className="text-sm font-medium text-green-600">$</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {payment.transactionId}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.role === 'admin' && (
                            <span className="mr-2">
                              {payment.user?.name} • 
                            </span>
                          )}
                          {payment.loan?.loanAccountNumber} • 
                          {new Date(payment.transactionDate).toLocaleDateString()}
                        </div>
                        {payment.description && (
                          <div className="mt-1 text-sm text-gray-500">
                            {payment.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="flex mt-1 space-x-2">
                          {getPaymentMethodBadge(payment.paymentMethod)}
                          {getStatusBadge(payment.status)}
                        </div>
                      </div>
                      <div className="flex flex-col space-y-2">
                        {user.role === 'admin' && (
                          <select
                            value={payment.status}
                            onChange={(e) => handleStatusUpdate(payment._id, e.target.value)}
                            disabled={loading}
                            className="px-2 py-1 text-xs border border-gray-300 rounded disabled:opacity-50"
                          >
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        )}
                        <div className="flex space-x-1">
                          {user.role === 'admin' && (
                            <button
                              onClick={() => onEdit(payment)}
                              className="px-2 py-1 text-xs text-blue-800 bg-blue-100 rounded hover:bg-blue-200"
                            >
                              Edit
                            </button>
                          )}
                          {user.role === 'admin' && (
                            <button
                              onClick={() => handleDelete(payment._id)}
                              disabled={loading}
                              className="px-2 py-1 text-xs text-red-800 bg-red-100 rounded hover:bg-red-200 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-12 text-center">
            <div className="mb-4 text-6xl text-gray-400">💳</div>
            <h3 className="mb-2 text-lg font-medium text-gray-900">No payments found</h3>
            <p className="text-gray-500">
              {filters.status || filters.paymentMethod || filters.search 
                ? 'Try changing your filters' 
                : 'No payment history available'
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary */}
      {filteredPayments.length > 0 && (
        <div className="p-6 bg-white rounded-lg shadow">
          <h3 className="mb-4 text-lg font-medium text-gray-900">Payment Summary</h3>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{filteredPayments.length}</div>
              <div className="text-sm text-gray-500">Total Payments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(filteredPayments.reduce((sum, payment) => sum + payment.amount, 0))}
              </div>
              <div className="text-sm text-gray-500">Total Amount</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {filteredPayments.filter(p => p.status === 'completed').length}
              </div>
              <div className="text-sm text-gray-500">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {filteredPayments.filter(p => p.status === 'pending').length}
              </div>
              <div className="text-sm text-gray-500">Pending</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentHistory;