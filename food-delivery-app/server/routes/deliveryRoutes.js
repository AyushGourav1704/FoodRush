const express = require('express');
const router = express.Router();
const { getAvailableOrders, acceptOrder, updateLocation, getMyDeliveries } = require('../controllers/deliveryController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect, authorize('delivery'));
router.get('/available-orders', getAvailableOrders);
router.post('/accept/:orderId', acceptOrder);
router.post('/location', updateLocation);
router.get('/my-deliveries', getMyDeliveries);

module.exports = router;
