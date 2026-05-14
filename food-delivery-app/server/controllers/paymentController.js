const Razorpay = require('razorpay');
const crypto = require('crypto');
const Payment = require('../models/Payment');
const Order = require('../models/Order');

const getRazorpay = () => new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_demo',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'demo_secret'
});

// @desc  Create Razorpay order
// @route POST /api/payment/create-order
exports.createRazorpayOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const razorpay = getRazorpay();
    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(order.pricing.total * 100), // paise
      currency: 'INR',
      receipt: order.orderNumber
    });

    // Save payment record
    await Payment.create({
      order: orderId,
      user: req.user._id,
      amount: order.pricing.total,
      method: 'razorpay',
      razorpayOrderId: rzpOrder.id
    });

    await Order.findByIdAndUpdate(orderId, { razorpayOrderId: rzpOrder.id });

    res.json({
      success: true,
      data: {
        razorpayOrderId: rzpOrder.id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Verify Razorpay payment
// @route POST /api/payment/verify
exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, orderId } = req.body;

    const body = razorpayOrderId + '|' + razorpayPaymentId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'demo_secret')
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      return res.status(400).json({ success: false, message: 'Payment verification failed' });
    }

    // Update payment and order
    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { razorpayPaymentId, razorpaySignature, status: 'success' }
    );
    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid', paymentId: razorpayPaymentId });

    res.json({ success: true, message: 'Payment verified successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get payment by order
// @route GET /api/payment/:orderId
exports.getPayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ order: req.params.orderId }).populate('order');
    res.json({ success: true, data: payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
