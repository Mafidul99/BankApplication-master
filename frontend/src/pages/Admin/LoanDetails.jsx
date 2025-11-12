import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

function LoanDetails() {
  const { id } = useParams();
  const [loan, setLoan] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [amortization, setAmortization] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [statusUpdate, setStatusUpdate] = useState('');

  useEffect(() => {
    fetchLoanDetails();
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
      setStatusUpdate(loanRes.data.loan.status);
    } catch (error) {
      console.error('Error fetching loan details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async () => {
    try {
      await axios.patch(`/api/loans/${id}/status`, { status: statusUpdate });
      fetchLoanDetails();
      alert('Loan status updated successfully');
    } catch (error) {
      console.error('Error updating loan status:', error);
      alert('Failed to update loan status');
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

  if (!loan) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-gray-900">Loan Not Found</h1>
        <p className="text-gray-500 mt-2">The requested loan could not be found.</p>
        <Link to="/admin/loans" className="text-blue-600 hover:text-blue-500 mt-4 inline-block">
          Back to Loans
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <Link to="/admin/loans" className="text-blue-600 hover:text-blue-500 mb-4 inline-block">
            ← Back to Loans
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Loan Details</h1>
          <p className="text-gray-600">{loan.loanAccountNumber}</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={statusUpdate}
            onChange={(e) => setStatusUpdate(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2"
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="defaulted">Defaulted</option>
          </select>
          <button
            onClick={handleStatusUpdate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Update Status
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['details', 'transactions', 'amortization'].map((tab) => (
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
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Loan Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Loan Information</h3>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Loan Account Number</dt>
                <dd className="text-sm text-gray-900">{loan.loanAccountNumber}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Status</dt>
                <dd className="text-sm">{getStatusBadge(loan.status)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Loan Type</dt>
                <dd className="text-sm text-gray-900 capitalize">{loan.loanType}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Loan Amount</dt>
                <dd className="text-sm text-gray-900">${loan.loanAmount.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Remaining Balance</dt>
                <dd className="text-sm text-gray-900">${loan.remainingBalance.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Interest Rate</dt>
                <dd className="text-sm text-gray-900">{loan.interestRate}%</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Loan Term</dt>
                <dd className="text-sm text-gray-900">{loan.loanTerm} months</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Monthly Payment</dt>
                <dd className="text-sm text-gray-900">${loan.monthlyPayment.toLocaleString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Start Date</dt>
                <dd className="text-sm text-gray-900">{new Date(loan.startDate).toLocaleDateString()}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">End Date</dt>
                <dd className="text-sm text-gray-900">{new Date(loan.endDate).toLocaleDateString()}</dd>
              </div>
              {loan.purpose && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Purpose</dt>
                  <dd className="text-sm text-gray-900">{loan.purpose}</dd>
                </div>
              )}
              {loan.description && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Description</dt>
                  <dd className="text-sm text-gray-900">{loan.description}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* User Information */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
            <dl className="grid grid-cols-1 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">User</dt>
                <dd className="text-sm text-gray-900">
                  <Link to={`/admin/users/${loan.user._id}`} className="text-blue-600 hover:text-blue-500">
                    {loan.user.name}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{loan.user.email}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Phone</dt>
                <dd className="text-sm text-gray-900">{loan.user.phone}</dd>
              </div>
              {loan.user.address && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Address</dt>
                  <dd className="text-sm text-gray-900">
                    {[loan.user.address.street, loan.user.address.city, loan.user.address.state, loan.user.address.zipCode]
                      .filter(Boolean)
                      .join(', ')}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {transactions.length > 0 ? (
              transactions.map((transaction) => (
                <div key={transaction._id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.transactionId}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {transaction.type} • {new Date(transaction.transactionDate).toLocaleDateString()}
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
                No transactions found for this loan
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'amortization' && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Amortization Schedule</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Beginning Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Principal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Interest
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ending Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {amortization.map((schedule) => (
                  <tr key={schedule.month}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {schedule.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(schedule.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${schedule.beginningBalance.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${schedule.monthlyPayment.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${schedule.principal.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${schedule.interest.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${schedule.endingBalance.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoanDetails;