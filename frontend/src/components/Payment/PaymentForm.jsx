import React, { useState} from 'react';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

// eslint-disable-next-line no-unused-vars
function PaymentForm({ loan, onPaymentSuccess, onCancel }) {
  // eslint-disable-next-line no-unused-vars
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cashfree');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!amount || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    if (amount > loan.remainingBalance) {
      setError('Payment amount cannot exceed remaining balance');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/payments/create-order', {
        loanId: loan._id,
        amount: parseFloat(amount),
        paymentMethod
      });

      const { order, paymentData } = response.data;

      // Redirect to Cashfree payment page
      const cashfree = await loadCashfreeSDK();
      
      cashfree.checkout({
        paymentSessionId: paymentData.payment_session_id,
        returnUrl: `${window.location.origin}/payment/callback?order_id=${order.orderId}`,
        // You can add more options here
      });

    } catch (error) {
      console.error('Payment initiation error:', error);
      setError(error.response?.data?.message || 'Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  const loadCashfreeSDK = () => {
    return new Promise((resolve, reject) => {
      if (window.Cashfree) {
        resolve(window.Cashfree);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
      script.onload = () => resolve(window.Cashfree);
      script.onerror = () => reject(new Error('Failed to load Cashfree SDK'));
      document.head.appendChild(script);
    });
  };

  return (
    <div className="fixed inset-0 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
      <div className="relative p-5 mx-auto bg-white border rounded-md shadow-lg top-20 w-96">
        <div className="mt-3">
          <h3 className="mb-4 text-lg font-medium leading-6 text-gray-900">
            Make Payment - {loan.loanAccountNumber}
          </h3>
          
          {error && (
            <div className="px-4 py-3 mb-4 text-red-700 bg-red-100 border border-red-400 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount to Pay
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="1"
                max={loan.remainingBalance}
                step="0.01"
                required
                className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm"
                placeholder="Enter amount"
              />
              <p className="mt-1 text-sm text-gray-500">
                Remaining Balance: ₹{loan.remainingBalance.toLocaleString('en-IN')}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="cashfree">Cashfree (All Methods)</option>
                <option value="card">Credit/Debit Card</option>
                <option value="upi">UPI</option>
                <option value="netbanking">Net Banking</option>
                <option value="wallet">Wallet</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-gray-800 bg-gray-300 rounded hover:bg-gray-400"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Proceed to Pay'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default PaymentForm;