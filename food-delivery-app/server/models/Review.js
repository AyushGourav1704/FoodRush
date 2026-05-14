const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  foodRating: { type: Number, min: 1, max: 5 },
  deliveryRating: { type: Number, min: 1, max: 5 },
  comment: { type: String, trim: true, maxlength: 500 },
  images: [String],
  likes: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  reply: {
    text: String,
    repliedAt: Date,
    repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
}, { timestamps: true });

// Update restaurant rating after review save
reviewSchema.post('save', async function () {
  const Restaurant = require('./Restaurant');
  const reviews = await mongoose.model('Review').find({ restaurant: this.restaurant });
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
  await Restaurant.findByIdAndUpdate(this.restaurant, {
    avgRating: Math.round(avg * 10) / 10,
    totalReviews: reviews.length
  });
});

module.exports = mongoose.model('Review', reviewSchema);
