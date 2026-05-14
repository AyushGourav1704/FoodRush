const Review = require('../models/Review');
const Order = require('../models/Order');

exports.createReview = async (req, res) => {
  try {
    const { restaurantId, orderId, rating, foodRating, deliveryRating, comment } = req.body;
    const existing = await Review.findOne({ user: req.user._id, order: orderId });
    if (existing) return res.status(400).json({ success: false, message: 'Review already submitted for this order' });

    const review = await Review.create({
      user: req.user._id, restaurant: restaurantId, order: orderId,
      rating, foodRating, deliveryRating, comment
    });
    await Order.findByIdAndUpdate(orderId, { isRated: true });
    const populated = await review.populate('user', 'name avatar');
    res.status(201).json({ success: true, message: 'Review submitted', data: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getRestaurantReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Review.countDocuments({ restaurant: req.params.restaurantId });
    const reviews = await Review.find({ restaurant: req.params.restaurantId })
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit));
    res.json({ success: true, data: reviews, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
