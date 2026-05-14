const express = require('express');
const router = express.Router();
const { createOrder, getUserOrders, getOrder, updateOrderStatus, cancelOrder, getAllOrders } = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createOrder);
router.get('/user', protect, getUserOrders);
router.get('/all', protect, authorize('admin', 'restaurant_owner'), getAllOrders);
router.get('/:id', protect, getOrder);
router.put('/:id/status', protect, authorize('admin', 'restaurant_owner', 'delivery'), updateOrderStatus);
router.put('/:id/cancel', protect, cancelOrder);

module.exports = router;
