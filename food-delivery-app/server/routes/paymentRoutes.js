const express = require('express');
const router = express.Router();
const { createRazorpayOrder, verifyRazorpayPayment, getPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyRazorpayPayment);
router.get('/:orderId', protect, getPayment);

module.exports = router;
