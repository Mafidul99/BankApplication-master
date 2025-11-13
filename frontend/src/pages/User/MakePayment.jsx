import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PaymentForm from '../../components/Payment/PaymentForm';

function MakePayment() {
  const navigate = useNavigate();
  const [successMessage, setSuccessMessage] = useState('');

  // eslint-disable-next-line no-unused-vars
  const handleSave = (payment) => {
    setSuccessMessage('Payment created successfully!');
    setTimeout(() => {
      navigate('/dashboard/payment-history');
    }, 2000);
  };

  const handleCancel = () => {
    navigate('/dashboard/payment-history');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Make Payment</h1>
          <p className="text-gray-600">Process a new payment for your loan</p>
        </div>
      </div>

      {successMessage && (
        <div className="px-4 py-3 text-green-600 border border-green-200 rounded-md bg-green-50">
          {successMessage}
        </div>
      )}

      <PaymentForm
        mode="create"
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default MakePayment;