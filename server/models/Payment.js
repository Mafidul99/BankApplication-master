import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  loan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Loan',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 1
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'cancelled'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['card', 'netbanking', 'upi', 'wallet', 'emi'],
  },
  cashfreeOrderId: {
    type: String
  },
  cashfreePaymentId: {
    type: String
  },
  cashfreeReferenceId: {
    type: String
  },
  paymentGateway: {
    type: String,
    default: 'cashfree'
  },
  description: {
    type: String
  },
  customerDetails: {
    name: String,
    email: String,
    phone: String
  },
  refunds: [{
    refundId: String,
    amount: Number,
    reason: String,
    status: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  paymentDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

paymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default mongoose.model('Payment', paymentSchema);