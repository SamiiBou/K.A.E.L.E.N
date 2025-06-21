const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  reference: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: String,
    required: true
  },
  cruPackage: {
    type: Number,
    required: true
  },
  wldAmount: {
    type: Number,
    required: true
  },
  transactionId: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'pending'
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

PaymentSchema.index({ reference: 1 });

module.exports = mongoose.model('Payment', PaymentSchema); 