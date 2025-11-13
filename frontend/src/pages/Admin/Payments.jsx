import React, { useState, useEffect } from 'react';
import axios from 'axios';
import PaymentForm from '../../components/Payment/PaymentForm';
import PaymentHistory from '../../components/Payment/PaymentHistory';

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

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

  const handleCreatePayment = () => {
    setShowCreateModal(true);
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment);
  };

  // eslint-disable-next-line no-unused-vars
  const handleSavePayment = (payment) => {
    setShowCreateModal(false);
    setEditingPayment(null);
    fetchPayments(); // Refresh the list
  };

  const handleCancel = () => {
    setShowCreateModal(false);
    setEditingPayment(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600">Manage all payment transactions</p>
        </div>
        <button
          onClick={handleCreatePayment}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Create Payment
        </button>
      </div>

      <PaymentHistory
        payments={payments}
        onEdit={handleEditPayment}
        onRefresh={fetchPayments}
        loading={loading}
      />

      {/* Create Payment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative w-full max-w-4xl p-5 mx-auto bg-white border rounded-md shadow-lg top-20">
            <PaymentForm
              mode="create"
              onSave={handleSavePayment}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}

      {/* Edit Payment Modal */}
      {editingPayment && (
        <div className="fixed inset-0 z-50 w-full h-full overflow-y-auto bg-gray-600 bg-opacity-50">
          <div className="relative w-full max-w-4xl p-5 mx-auto bg-white border rounded-md shadow-lg top-20">
            <PaymentForm
              payment={editingPayment}
              mode="edit"
              onSave={handleSavePayment}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPayments;