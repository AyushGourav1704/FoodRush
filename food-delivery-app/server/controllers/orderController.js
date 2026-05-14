const Order = require('../models/Order');
const FoodItem = require('../models/FoodItem');
const Restaurant = require('../models/Restaurant');
const { getIO } = require('../sockets/socket');

exports.createOrder = async (req, res) => {
  try {
    const { restaurantId, items, deliveryAddress, paymentMethod, specialInstructions, couponCode } = req.body;

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    // Calculate pricing
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const food = await FoodItem.findById(item.foodItemId);
      if (!food) return res.status(404).json({ success: false, message: `Food item not found: ${item.foodItemId}` });

      const price = food.discountedPrice || food.price;
      let customizationTotal = 0;
      if (item.customizations) {
        item.customizations.forEach(c => c.selected?.forEach(s => customizationTotal += s.price || 0));
      }
      const itemSubtotal = (price + customizationTotal) * item.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        foodItem: food._id,
        name: food.name,
        image: food.image,
        price: price + customizationTotal,
        quantity: item.quantity,
        customizations: item.customizations || [],
        subtotal: itemSubtotal
      });
    }

    const deliveryFee = restaurant.deliveryFee || 30;
    const tax = Math.round(subtotal * 0.05); // 5% GST
    const discount = 0; // Apply coupon logic here
    const total = subtotal + deliveryFee + tax - discount;

    const estimatedDeliveryTime = new Date(Date.now() + 45 * 60 * 1000); // 45 mins

    const order = await Order.create({
      customer: req.user._id,
      restaurant: restaurantId,
      items: orderItems,
      deliveryAddress,
      paymentMethod: paymentMethod || 'cod',
      specialInstructions,
      couponCode,
      pricing: { subtotal, deliveryFee, tax, discount, total },
      estimatedDeliveryTime,
      statusHistory: [{ status: 'pending', timestamp: new Date() }]
    });

    await Restaurant.findByIdAndUpdate(restaurantId, { $inc: { totalOrders: 1 } });

    // Notify restaurant via socket
    const io = getIO();
    io.to(`restaurant_${restaurantId}`).emit('new_order', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customer: req.user.name,
      total: order.pricing.total
    });

    const populatedOrder = await Order.findById(order._id)
      .populate('restaurant', 'name image address')
      .populate('items.foodItem', 'name image');

    res.status(201).json({ success: true, message: 'Order placed successfully', data: populatedOrder });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUserOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query = { customer: req.user._id };
    if (status) query.orderStatus = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('restaurant', 'name image')
      .populate('items.foodItem', 'name image')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, data: orders, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('restaurant', 'name image address phone')
      .populate('customer', 'name phone')
      .populate('deliveryPartner', 'name phone avatar')
      .populate('items.foodItem', 'name image');

    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { status, note } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    order.orderStatus = status;
    order.statusHistory.push({ status, timestamp: new Date(), note });
    if (status === 'delivered') order.actualDeliveryTime = new Date();
    await order.save();

    // Real-time update to customer
    const io = getIO();
    io.to(`order_${order._id}`).emit('order_status_update', {
      orderId: order._id,
      status,
      note,
      timestamp: new Date()
    });

    res.json({ success: true, message: 'Order status updated', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const cancellableStatuses = ['pending', 'confirmed'];
    if (!cancellableStatuses.includes(order.orderStatus)) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
    }

    order.orderStatus = 'cancelled';
    order.cancelReason = reason;
    order.cancelledBy = req.user.role === 'admin' ? 'admin' : 'customer';
    order.statusHistory.push({ status: 'cancelled', timestamp: new Date(), note: reason });
    await order.save();

    const io = getIO();
    io.to(`order_${order._id}`).emit('order_status_update', { orderId: order._id, status: 'cancelled' });

    res.json({ success: true, message: 'Order cancelled', data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const { status, restaurant, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.orderStatus = status;
    if (restaurant) query.restaurant = restaurant;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('customer', 'name email phone')
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, data: orders, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
