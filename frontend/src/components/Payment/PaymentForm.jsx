import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

function PaymentForm({ payment = null, onSave, onCancel, mode = 'create' }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [userLoans, setUserLoans] = useState([]);
  const [allLoans, setAllLoans] = useState([]);
  const [formData, setFormData] = useState({
    loanId: payment?.loan?._id || '',
    amount: payment?.amount || '',
    paymentMethod: payment?.paymentMethod || 'cashfree',
    description: payment?.description || '',
    transactionDate: payment?.transactionDate ? new Date(payment.transactionDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});
  const [selectedLoan, setSelectedLoan] = useState(null);

  useEffect(() => {
    fetchLoans();
    if (payment?.loan) {
      setSelectedLoan(payment.loan);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (formData.loanId) {
      fetchLoanDetails(formData.loanId);
    }
  }, [formData.loanId]);

  const fetchLoans = async () => {
    try {
      let response;
      if (user.role === 'admin') {
        response = await axios.get('/api/loans?limit=100&status=active');
        setAllLoans(response.data.loans);
      } else {
        response = await axios.get('/api/loans?limit=100&status=active');
        setUserLoans(response.data.loans);
      }
    } catch (error) {
      console.error('Error fetching loans:', error);
    }
  };

  const fetchLoanDetails = async (loanId) => {
    try {
      const response = await axios.get(`/api/loans/${loanId}`);
      setSelectedLoan(response.data.loan);
    } catch (error) {
      console.error('Error fetching loan details:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.loanId) {
      newErrors.loanId = 'Please select a loan';
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount';
    } else if (selectedLoan && parseFloat(formData.amount) > selectedLoan.remainingBalance) {
      newErrors.amount = `Amount cannot exceed remaining balance of $${selectedLoan.remainingBalance}`;
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    if (!formData.transactionDate) {
      newErrors.transactionDate = 'Please select a transaction date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const paymentData = {
        loanId: formData.loanId,
        amount: parseFloat(formData.amount),
        type: 'payment',
        paymentMethod: formData.paymentMethod,
        description: formData.description,
        transactionDate: formData.transactionDate
      };

      let response;
      if (mode === 'create') {
        response = await axios.post('/api/transactions', paymentData);
      } else {
        response = await axios.put(`/api/transactions/${payment._id}`, paymentData);
      }

      onSave(response.data.transaction);
    } catch (error) {
      console.error('Error saving payment:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to save payment' });
    } finally {
      setLoading(false);
    }
  };

  const loans = user.role === 'admin' ? allLoans : userLoans;

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="mb-6 text-xl font-bold text-gray-900">
        {mode === 'create' ? 'Make Payment' : 'Edit Payment'}
      </h2>

      {errors.submit && (
        <div className="px-4 py-3 mb-4 text-red-600 border border-red-200 rounded-md bg-red-50">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Loan Selection */}
          <div>
            <label htmlFor="loanId" className="block text-sm font-medium text-gray-700">
              Select Loan {user.role === 'admin' && '(All Users)'}
            </label>
            <select
              id="loanId"
              name="loanId"
              value={formData.loanId}
              onChange={handleChange}
              className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                errors.loanId ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              disabled={mode === 'edit'}
            >
              <option value="">Select a loan</option>
              {loans.map((loan) => (
                <option key={loan._id} value={loan._id}>
                  {loan.loanAccountNumber} - {loan.user?.name} (${loan.remainingBalance} remaining)
                </option>
              ))}
            </select>
            {errors.loanId && (
              <p className="mt-1 text-sm text-red-600">{errors.loanId}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700">
              Payment Method
            </label>
            <select
              id="paymentMethod"
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                errors.paymentMethod ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            >
              <option value="cashfree">Cashfree</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="card">Credit/Debit Card</option>
              <option value="cash">Cash</option>
              <option value="check">Check</option>
            </select>
            {errors.paymentMethod && (
              <p className="mt-1 text-sm text-red-600">{errors.paymentMethod}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                max={selectedLoan?.remainingBalance}
                className={`block w-full pl-7 pr-12 border rounded-md shadow-sm p-2 ${
                  errors.amount ? 'border-red-300' : 'border-gray-300'
                } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="0.00"
              />
            </div>
            {errors.amount && (
              <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
            )}
            {selectedLoan && (
              <p className="mt-1 text-sm text-gray-500">
                Remaining balance: ${selectedLoan.remainingBalance.toLocaleString()}
              </p>
            )}
          </div>

          {/* Transaction Date */}
          <div>
            <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">
              Transaction Date
            </label>
            <input
              type="date"
              id="transactionDate"
              name="transactionDate"
              value={formData.transactionDate}
              onChange={handleChange}
              className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                errors.transactionDate ? 'border-red-300' : 'border-gray-300'
              } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
            />
            {errors.transactionDate && (
              <p className="mt-1 text-sm text-red-600">{errors.transactionDate}</p>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="block w-full p-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Add any additional notes about this payment..."
          />
        </div>

        {/* Selected Loan Info */}
        {selectedLoan && (
          <div className="p-4 border border-blue-200 rounded-md bg-blue-50">
            <h4 className="mb-2 text-sm font-medium text-blue-800">Selected Loan Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <span className="text-blue-600">Account:</span>
                <p className="font-medium">{selectedLoan.loanAccountNumber}</p>
              </div>
              <div>
                <span className="text-blue-600">Borrower:</span>
                <p className="font-medium">{selectedLoan.user?.name}</p>
              </div>
              <div>
                <span className="text-blue-600">Monthly Payment:</span>
                <p className="font-medium">${selectedLoan.monthlyPayment.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-blue-600">Remaining:</span>
                <p className="font-medium">${selectedLoan.remainingBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end pt-4 space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-sm font-medium text-gray-800 transition-colors bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 text-sm font-medium text-white transition-colors bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : mode === 'create' ? 'Make Payment' : 'Update Payment'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PaymentForm;