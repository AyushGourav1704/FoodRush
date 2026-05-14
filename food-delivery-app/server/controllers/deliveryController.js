const Order = require('../models/Order');
const { getIO } = require('../sockets/socket');

exports.getAvailableOrders = async (req, res) => {
  try {
    const orders = await Order.find({ orderStatus: 'ready', deliveryPartner: null })
      .populate('restaurant', 'name address')
      .populate('customer', 'name phone')
      .sort({ createdAt: 1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.acceptOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.deliveryPartner) return res.status(400).json({ success: false, message: 'Order already assigned' });

    order.deliveryPartner = req.user._id;
    order.orderStatus = 'picked_up';
    order.statusHistory.push({ status: 'picked_up', timestamp: new Date() });
    await order.save();

    const io = getIO();
    io.to(`order_${order._id}`).emit('order_status_update', { orderId: order._id, status: 'picked_up' });

    res.json({ success: true, message: 'Order accepted', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateLocation = async (req, res) => {
  try {
    const { orderId, lat, lng } = req.body;
    const order = await Order.findByIdAndUpdate(orderId,
      { deliveryPartnerLocation: { lat, lng, updatedAt: new Date() } },
      { new: true }
    );
    const io = getIO();
    io.to(`order_${orderId}`).emit('delivery_location', { lat, lng, updatedAt: new Date() });
    res.json({ success: true, message: 'Location updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMyDeliveries = async (req, res) => {
  try {
    const orders = await Order.find({ deliveryPartner: req.user._id })
      .populate('restaurant', 'name address')
      .populate('customer', 'name phone')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
