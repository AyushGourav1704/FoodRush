const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  method: { type: String, enum: ['razorpay', 'stripe', 'cod'] },
  status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
  // Razorpay
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  // Stripe
  stripePaymentIntentId: String,
  stripeClientSecret: String,
  // Meta
  metadata: mongoose.Schema.Types.Mixed,
  failureReason: String,
  refundId: String,
  refundAmount: Number,
  refundedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);
