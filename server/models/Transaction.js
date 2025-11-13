import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    enum: ['payment', 'disbursement', 'refund'],
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cashfree', 'card', 'upi', 'netbanking', 'wallet', 'bank_transfer', 'cash', 'check'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
    default: 'pending'
  },
  cashfreePaymentId: {
    type: String,
    sparse: true
  },
  cashfreeOrderId: {
    type: String,
    sparse: true
  },
  refundId: {
    type: String,
    sparse: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  transactionDate: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for better query performance
transactionSchema.index({ user: 1, transactionDate: -1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ loan: 1 });

// Virtual for formatted amount
transactionSchema.virtual('formattedAmount').get(function() {
  return `₹${this.amount.toLocaleString('en-IN')}`;
});

// Method to check if transaction is successful
transactionSchema.methods.isSuccessful = function() {
  return this.status === 'completed';
};

// Static method to get total payments for a loan
transactionSchema.statics.getLoanTotalPayments = async function(loanId) {
  const result = await this.aggregate([
    {
      $match: {
        loan: mongoose.Types.ObjectId(loanId),
        type: 'payment',
        status: 'completed'
      }
    },
    {
      $group: {
        _id: '$loan',
        totalPaid: { $sum: '$amount' },
        paymentCount: { $sum: 1 }
      }
    }
  ]);
  
  return result.length > 0 ? result[0] : { totalPaid: 0, paymentCount: 0 };
};

export default mongoose.model('Transaction', transactionSchema);