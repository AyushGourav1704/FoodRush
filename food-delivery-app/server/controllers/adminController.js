const User = require('../models/User');
const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const FoodItem = require('../models/FoodItem');
const Payment = require('../models/Payment');

// @desc  Admin dashboard analytics
// @route GET /api/admin/analytics
exports.getAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalRestaurants, totalOrders, totalRevenue] = await Promise.all([
      User.countDocuments({ role: 'customer' }),
      Restaurant.countDocuments({ isActive: true }),
      Order.countDocuments(),
      Payment.aggregate([{ $match: { status: 'success' } }, { $group: { _id: null, total: { $sum: '$amount' } } }])
    ]);

    // Orders by status
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } }
    ]);

    // Revenue last 7 days
    const last7Days = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const dailyRevenue = await Payment.aggregate([
      { $match: { status: 'success', createdAt: { $gte: last7Days } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, revenue: { $sum: '$amount' }, orders: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Top restaurants
    const topRestaurants = await Order.aggregate([
      { $group: { _id: '$restaurant', orderCount: { $sum: 1 }, revenue: { $sum: '$pricing.total' } } },
      { $sort: { orderCount: -1 } }, { $limit: 5 },
      { $lookup: { from: 'restaurants', localField: '_id', foreignField: '_id', as: 'restaurant' } },
      { $unwind: '$restaurant' },
      { $project: { name: '$restaurant.name', image: '$restaurant.image', orderCount: 1, revenue: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalRestaurants,
          totalOrders,
          totalRevenue: totalRevenue[0]?.total || 0
        },
        ordersByStatus,
        dailyRevenue,
        topRestaurants
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Get all users
// @route GET /api/admin/users
exports.getUsers = async (req, res) => {
  try {
    const { role, page = 1, limit = 20, search } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(query);
    const users = await User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, data: users, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc  Toggle user active status
// @route PUT /api/admin/users/:id/toggle
exports.toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
