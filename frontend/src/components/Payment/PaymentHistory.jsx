import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

function PaymentHistory() {
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchPaymentHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/payments/history?page=${page}&limit=10`);
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="py-4 text-center">Loading payment history...</div>;
  }

  return (
    <div className="overflow-hidden bg-white shadow sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900">
          Payment History
        </h3>
      </div>
      
      <div className="border-t border-gray-200">
        <ul className="divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <li key={transaction._id} className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      transaction.status === 'completed' ? 'bg-green-500' : 
                      transaction.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}>
                      <span className="text-sm font-medium text-white">₹</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {transaction.transactionId}
                    </div>
                    <div className="text-sm text-gray-500">
                      {transaction.loan?.loanAccountNumber} • {transaction.paymentMethod}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    ₹{transaction.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                  {transaction.status}
                </span>
                {transaction.description && (
                  <div className="text-sm text-gray-500">
                    {transaction.description}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
          <div className="flex justify-between sm:flex-1">
            <button
              onClick={() => setPage(page - 1)}
              disabled={!pagination.hasPrev}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="mx-4 text-sm text-gray-700">
              Page <span className="font-medium">{page}</span> of <span className="font-medium">{pagination.totalPages}</span>
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={!pagination.hasNext}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentHistory;