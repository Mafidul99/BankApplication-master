import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import PaymentHistory from '../../components/Payment/PaymentHistory';

function UserPaymentHistory() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/transactions?type=payment');
      setPayments(response.data.transactions);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment History</h1>
          <p className="text-gray-600">View your payment transactions</p>
        </div>
        <Link
          to="/dashboard/make-payment"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Make Payment
        </Link>
      </div>

      <PaymentHistory
        payments={payments}
        onRefresh={fetchPayments}
        loading={loading}
      />
    </div>
  );
}

export default UserPaymentHistory;