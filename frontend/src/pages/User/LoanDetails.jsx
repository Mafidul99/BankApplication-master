import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function LoanDetails() {
  const { id } = useParams();
  // eslint-disable-next-line no-unused-vars
  const navigate = useNavigate();
  const [loan, setLoan] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amortization, setAmortization] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentMethod: 'bank_transfer',
    description: ''
  });

  useEffect(() => {
    fetchLoanDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      const [loanRes, transactionsRes, amortizationRes] = await Promise.all([
        axios.get(`/api/loans/${id}`),
        axios.get(`/api/transactions/loan/${id}`),
        axios.get(`/api/loans/${id}/amortization`)
      ]);

      setLoan(loanRes.data.loan);
      setTransactions(transactionsRes.data.transactions);
      setAmortization(amortizationRes.data.schedule);
      
      // Set default payment amount to minimum payment or remaining balance
      const defaultAmount = Math.min(
        loanRes.data.loan.monthlyPayment,
        loanRes.data.loan.remainingBalance
      );
      setPaymentData(prev => ({
        ...prev,
        amount: defaultAmount.toFixed(2)
      }));
    } catch (error) {
      console.error('Error fetching loan details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    
    try {
      await axios.post('/api/transactions', {
        loanId: id,
        amount: parseFloat(paymentData.amount),
        type: 'payment',
        paymentMethod: paymentData.paymentMethod,
        description: paymentData.description || `Payment for loan ${loan?.loanAccountNumber}`
      });
      
      setShowPaymentModal(false);
      setPaymentData({
        amount: '',
        paymentMethod: 'bank_transfer',
        description: ''
      });
      
      // Refresh loan details to update balance
      fetchLoanDetails();
      alert('Payment submitted successfully!');
    } catch (error) {
      console.error('Error submitting payment:', error);
      alert('Failed to submit payment. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pending Review' },
      approved: { color: 'bg-green-100 text-green-800', label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800', label: 'Rejected' },
      active: { color: 'bg-blue-100 text-blue-800', label: 'Active' },
      completed: { color: 'bg-gray-100 text-gray-800', label: 'Paid Off' },
      defaulted: { color: 'bg-red-100 text-red-800', label: 'Defaulted' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const calculateProgress = () => {
    if (!loan) return 0;
    const paid = loan.loanAmount - loan.remainingBalance;
    return (paid / loan.loanAmount) * 100;
  };

  const PaymentModal = () => {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Make a Payment
            </h3>
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Loan Account</label>
                <input
                  type="text"
                  value={loan?.loanAccountNumber}
                  disabled
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Amount ($)</label>
                <input
                  type="number"
                  value={paymentData.amount}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, amount: e.target.value }))}
                  required
                  min="1"
                  max={loan?.remainingBalance}
                  step="0.01"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Enter payment amount"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Remaining balance: ${loan?.remainingBalance?.toLocaleString()}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                <select
                  value={paymentData.paymentMethod}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                  required
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="cashfree">Cashfree</option>
                  <option value="card">Credit/Debit Card</option>
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
                <textarea
                  value={paymentData.description}
                  onChange={(e) => setPaymentData(prev => ({ ...prev, description: e.target.value }))}
                  rows="2"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  placeholder="Add a note for this payment"
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Payment Summary</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <div className="flex justify-between">
                    <span>Payment Amount:</span>
                    <span>${parseFloat(paymentData.amount || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>New Balance:</span>
                    <span>${(loan?.remainingBalance - parseFloat(paymentData.amount || 0)).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentLoading || !paymentData.amount || parseFloat(paymentData.amount) > loan?.remainingBalance}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium disabled:opacity-50"
                >
                  {paymentLoading ? 'Processing...' : 'Submit Payment'}
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

  if (!loan) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Loan Not Found</h1>
        <p className="text-gray-500 mt-2">The requested loan could not be found.</p>
        <Link to="/dashboard/loans" className="text-blue-600 hover:text-blue-500 mt-4 inline-block">
          Back to My Loans
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-start">
          <div>
            <Link to="/dashboard/loans" className="text-blue-600 hover:text-blue-500 mb-4 inline-block">
              ← Back to My Loans
            </Link>
            <div className="flex items-center space-x-4">
              <div className="h-16 w-16 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-xl">L</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{loan.loanAccountNumber}</h1>
                <p className="text-gray-600 capitalize">{loan.loanType} Loan</p>
                <div className="flex items-center space-x-4 mt-2">
                  {getStatusBadge(loan.status)}
                  <span className="text-sm text-gray-500">
                    Applied on {new Date(loan.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {loan.status === 'active' && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg text-sm font-medium shadow-sm"
            >
              Make Payment
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Paid: ${(loan.loanAmount - loan.remainingBalance).toLocaleString()}</span>
            <span>Remaining: ${loan.remainingBalance.toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${calculateProgress()}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-500 mt-1 text-right">
            {calculateProgress().toFixed(1)}% Paid
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-blue-600">${loan.loanAmount.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Loan Amount</div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-green-600">${loan.remainingBalance.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Remaining Balance</div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-purple-600">{loan.interestRate}%</div>
          <div className="text-sm text-gray-500">Interest Rate</div>
        </div>
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <div className="text-2xl font-bold text-orange-600">${loan.monthlyPayment.toLocaleString()}</div>
          <div className="text-sm text-gray-500">Monthly Payment</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px space-x-8 px-6">
            {['overview', 'transactions', 'schedule', 'documents'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm capitalize whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab === 'overview' ? 'Loan Overview' : 
                 tab === 'transactions' ? 'Payment History' :
                 tab === 'schedule' ? 'Payment Schedule' : 'Documents'}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Loan Details */}
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Loan Details</h3>
                <dl className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <dt className="text-sm font-medium text-gray-500">Loan Type</dt>
                    <dd className="text-sm text-gray-900 capitalize">{loan.loanType}</dd>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <dt className="text-sm font-medium text-gray-500">Loan Term</dt>
                    <dd className="text-sm text-gray-900">{loan.loanTerm} months</dd>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                    <dd className="text-sm text-gray-900">{new Date(loan.startDate).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <dt className="text-sm font-medium text-gray-500">End Date</dt>
                    <dd className="text-sm text-gray-900">{new Date(loan.endDate).toLocaleDateString()}</dd>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <dt className="text-sm font-medium text-gray-500">Total Interest</dt>
                    <dd className="text-sm text-gray-900">
                      ${((loan.monthlyPayment * loan.loanTerm) - loan.loanAmount).toLocaleString()}
                    </dd>
                  </div>
                </dl>

                {loan.purpose && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Loan Purpose</h4>
                    <p className="text-sm text-gray-600">{loan.purpose}</p>
                  </div>
                )}

                {loan.description && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Description</h4>
                    <p className="text-sm text-gray-600">{loan.description}</p>
                  </div>
                )}
              </div>

              {/* Next Payment & Actions */}
              <div className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-blue-900 mb-4">Next Payment Due</h3>
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    ${loan.monthlyPayment.toLocaleString()}
                  </div>
                  <p className="text-blue-700 text-sm">
                    Due on {new Date(loan.endDate).toLocaleDateString()}
                  </p>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md text-sm font-medium"
                  >
                    Pay Now
                  </button>
                </div>

                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                      onClick={() => setActiveTab('schedule')}
                      className="w-full text-left p-3 border border-gray-200 rounded-md hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">View Payment Schedule</div>
                      <div className="text-sm text-gray-500">See all upcoming payments</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('transactions')}
                      className="w-full text-left p-3 border border-gray-200 rounded-md hover:border-green-300 hover:bg-green-50 transition-colors"
                    >
                      <div className="font-medium text-gray-900">Payment History</div>
                      <div className="text-sm text-gray-500">View past transactions</div>
                    </button>
                    <button className="w-full text-left p-3 border border-gray-200 rounded-md hover:border-purple-300 hover:bg-purple-50 transition-colors">
                      <div className="font-medium text-gray-900">Download Statement</div>
                      <div className="text-sm text-gray-500">Get PDF statement</div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transactions' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Payment History</h3>
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Make Payment
                </button>
              </div>

              {transactions.length > 0 ? (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Transaction ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Method
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction._id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(transaction.transactionDate).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                            {transaction.transactionId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            ${transaction.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {transaction.paymentMethod?.replace('_', ' ')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.status === 'completed' 
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {transaction.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">💳</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions yet</h3>
                  <p className="text-gray-500 mb-4">Make your first payment to get started</p>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md text-sm font-medium"
                  >
                    Make First Payment
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'schedule' && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-6">Payment Schedule</h3>
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-gray-300">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Payment #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Principal
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Interest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Total Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Remaining Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {amortization.slice(0, 12).map((schedule) => (
                      <tr key={schedule.month} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {schedule.month}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(schedule.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${schedule.principal.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${schedule.interest.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${schedule.monthlyPayment.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${schedule.endingBalance.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {amortization.length > 12 && (
                <div className="text-center mt-4">
                  <p className="text-sm text-gray-500">
                    Showing first 12 of {amortization.length} payments
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Loan Documents</h3>
              <p className="text-gray-500 mb-4">Your loan documents and statements will appear here</p>
              <div className="space-y-3 max-w-md mx-auto">
                <button className="w-full p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors text-left">
                  <div className="font-medium text-gray-900">Loan Agreement</div>
                  <div className="text-sm text-gray-500">Download PDF document</div>
                </button>
                <button className="w-full p-4 border border-gray-200 rounded-lg hover:border-green-300 hover:bg-green-50 transition-colors text-left">
                  <div className="font-medium text-gray-900">Payment Schedule</div>
                  <div className="text-sm text-gray-500">View amortization table</div>
                </button>
                <button className="w-full p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-colors text-left">
                  <div className="font-medium text-gray-900">Tax Statements</div>
                  <div className="text-sm text-gray-500">Annual interest statements</div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && <PaymentModal />}
    </div>
  );
}

export default LoanDetails;