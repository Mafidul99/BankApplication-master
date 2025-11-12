import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

function MyLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: '',
    loanType: '',
    search: ''
  });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    fetchLoans();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const canDeleteLoan = (loan) => {
    // Users can only delete pending loans that have no transactions
    return loan.status === 'pending' && loan.remainingBalance === loan.loanAmount;
  };

  const handleDeleteLoan = async (loanId, loanNumber) => {
    if (window.confirm(`Are you sure you want to delete loan application "${loanNumber}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`/api/loans/${loanId}`);
        fetchLoans(pagination.page);
        alert('Loan application deleted successfully');
      } catch (error) {
        console.error('Error deleting loan:', error);
        if (error.response?.status === 400) {
          alert('Cannot delete loan with existing transactions. Please contact admin.');
        } else {
          alert('Failed to delete loan application');
        }
      }
    }
  };

  // Create Loan Modal
  const CreateLoanModal = () => {
    const [formData, setFormData] = useState({
      loanType: 'personal',
      loanAmount: '',
      interestRate: '',
      loanTerm: '',
      startDate: '',
      endDate: '',
      purpose: '',
      description: ''
    });

    const [errors, setErrors] = useState({});

    const calculateEndDate = (startDate, loanTerm) => {
      if (!startDate || !loanTerm) return '';
      const start = new Date(startDate);
      start.setMonth(start.getMonth() + parseInt(loanTerm));
      return start.toISOString().split('T')[0];
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      setErrors({});
      
      // Validation
      const newErrors = {};
      if (!formData.loanAmount || formData.loanAmount < 1000) {
        newErrors.loanAmount = 'Loan amount must be at least $1,000';
      }
      if (!formData.interestRate || formData.interestRate < 1 || formData.interestRate > 50) {
        newErrors.interestRate = 'Interest rate must be between 1% and 50%';
      }
      if (!formData.loanTerm || formData.loanTerm < 1 || formData.loanTerm > 360) {
        newErrors.loanTerm = 'Loan term must be between 1 and 360 months';
      }
      if (!formData.startDate) {
        newErrors.startDate = 'Start date is required';
      }
      if (!formData.purpose) {
        newErrors.purpose = 'Purpose is required';
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }

      setCreateLoading(true);
      try {
        const submitData = {
          ...formData,
          endDate: calculateEndDate(formData.startDate, formData.loanTerm)
        };

        await axios.post('/api/loans', submitData);
        setShowCreateModal(false);
        fetchLoans();
        // Reset form
        setFormData({
          loanType: 'personal',
          loanAmount: '',
          interestRate: '',
          loanTerm: '',
          startDate: '',
          endDate: '',
          purpose: '',
          description: ''
        });
        alert('Loan application submitted successfully! It will be reviewed by our team.');
      } catch (error) {
        console.error('Error creating loan:', error);
        alert('Failed to submit loan application. Please try again.');
      } finally {
        setCreateLoading(false);
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

      // Auto-calculate end date when start date or loan term changes
      if (name === 'startDate' || name === 'loanTerm') {
        const endDate = calculateEndDate(
          name === 'startDate' ? value : formData.startDate,
          name === 'loanTerm' ? value : formData.loanTerm
        );
        setFormData(prev => ({
          ...prev,
          endDate
        }));
      }
    };

    const loanTypes = [
      { value: 'personal', label: 'Personal Loan', description: 'For personal expenses, medical bills, or emergencies' },
      { value: 'home', label: 'Home Loan', description: 'For purchasing or renovating a home' },
      { value: 'car', label: 'Car Loan', description: 'For purchasing a new or used vehicle' },
      { value: 'business', label: 'Business Loan', description: 'For business expansion or capital' },
      { value: 'education', label: 'Education Loan', description: 'For tuition fees and educational expenses' }
    ];

    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
        <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
          <div className="mt-3">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Apply for New Loan</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Loan Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Loan Type</label>
                <div className="grid grid-cols-1 gap-2">
                  {loanTypes.map((type) => (
                    <label key={type.value} className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer">
                      <input
                        type="radio"
                        name="loanType"
                        value={type.value}
                        checked={formData.loanType === type.value}
                        onChange={handleChange}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{type.label}</div>
                        <div className="text-xs text-gray-500 mt-1">{type.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Loan Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Loan Amount ($)</label>
                  <input
                    type="number"
                    name="loanAmount"
                    value={formData.loanAmount}
                    onChange={handleChange}
                    required
                    min="1000"
                    max="1000000"
                    placeholder="Enter amount"
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                      errors.loanAmount ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.loanAmount && (
                    <p className="mt-1 text-sm text-red-600">{errors.loanAmount}</p>
                  )}
                </div>

                {/* Interest Rate */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Interest Rate (%)</label>
                  <input
                    type="number"
                    name="interestRate"
                    value={formData.interestRate}
                    onChange={handleChange}
                    required
                    min="1"
                    max="50"
                    step="0.1"
                    placeholder="e.g., 5.5"
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                      errors.interestRate ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.interestRate && (
                    <p className="mt-1 text-sm text-red-600">{errors.interestRate}</p>
                  )}
                </div>

                {/* Loan Term */}
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
                    placeholder="e.g., 36"
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                      errors.loanTerm ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.loanTerm && (
                    <p className="mt-1 text-sm text-red-600">{errors.loanTerm}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    {formData.loanTerm ? `Approximately ${Math.floor(formData.loanTerm / 12)} years ${formData.loanTerm % 12} months` : ''}
                  </p>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                    min={new Date().toISOString().split('T')[0]}
                    className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                      errors.startDate ? 'border-red-300' : 'border-gray-300'
                    } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
                  )}
                </div>

                {/* End Date (Auto-calculated) */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Estimated End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    disabled
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-gray-50 text-gray-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">This date is automatically calculated based on start date and loan term</p>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Purpose of Loan</label>
                <input
                  type="text"
                  name="purpose"
                  value={formData.purpose}
                  onChange={handleChange}
                  required
                  placeholder="Briefly describe what you need the loan for"
                  className={`mt-1 block w-full border rounded-md shadow-sm p-2 ${
                    errors.purpose ? 'border-red-300' : 'border-gray-300'
                  } focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                />
                {errors.purpose && (
                  <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Additional Details (Optional)
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Any additional information that might help with your application..."
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  required
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div className="text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="/terms" className="text-blue-600 hover:text-blue-500">
                    terms and conditions
                  </a>
                  {' '}and confirm that all information provided is accurate and complete.
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {createLoading ? 'Submitting...' : 'Submit Application'}
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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Loans</h1>
          <p className="text-gray-600 mt-1">Manage your loan applications and track their status</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
        >
          Apply for Loan
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">💰</span>
              </div>
            </div>
            <div className="ml-3">
              <dt className="text-sm font-medium text-gray-500">Total Loans</dt>
              <dd className="text-lg font-bold text-gray-900">{loans.length}</dd>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">✅</span>
              </div>
            </div>
            <div className="ml-3">
              <dt className="text-sm font-medium text-gray-500">Approved</dt>
              <dd className="text-lg font-bold text-gray-900">
                {loans.filter(loan => loan.status === 'approved' || loan.status === 'active').length}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">⏳</span>
              </div>
            </div>
            <div className="ml-3">
              <dt className="text-sm font-medium text-gray-500">Pending</dt>
              <dd className="text-lg font-bold text-gray-900">
                {loans.filter(loan => loan.status === 'pending').length}
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">❌</span>
              </div>
            </div>
            <div className="ml-3">
              <dt className="text-sm font-medium text-gray-500">Rejected</dt>
              <dd className="text-lg font-bold text-gray-900">
                {loans.filter(loan => loan.status === 'rejected').length}
              </dd>
            </div>
          </div>
        </div>
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
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors"
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
                <div className="px-4 py-4 sm:px-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-medium text-sm">L</span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <Link
                          to={`/dashboard/loans/${loan._id}`}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          {loan.loanAccountNumber}
                        </Link>
                        <div className="text-sm text-gray-500 capitalize">
                          {loan.loanType} Loan • Applied {new Date(loan.createdAt).toLocaleDateString()}
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
                        <Link
                          to={`/dashboard/loans/${loan._id}`}
                          className="text-blue-600 hover:text-blue-500"
                        >
                          View Details
                        </Link>
                        {canDeleteLoan(loan) && (
                          <button
                            onClick={() => handleDeleteLoan(loan._id, loan.loanAccountNumber)}
                            className="text-red-600 hover:text-red-500"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {loan.purpose && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Purpose:</span> {loan.purpose}
                      </p>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No loans found</h3>
            <p className="text-gray-500 mb-4">
              {filters.status || filters.loanType || filters.search 
                ? 'Try changing your filters' 
                : 'Get started by applying for your first loan'
              }
            </p>
            {!(filters.status || filters.loanType || filters.search) && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Apply for Loan
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
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

export default MyLoans;