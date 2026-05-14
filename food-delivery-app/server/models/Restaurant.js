const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  cuisine: [String],
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  image: { type: String, default: '' },
  coverImage: { type: String, default: '' },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: { type: String, default: 'India' },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number }
    }
  },
  phone: String,
  email: String,
  openingHours: {
    monday: { open: String, close: String, isClosed: Boolean },
    tuesday: { open: String, close: String, isClosed: Boolean },
    wednesday: { open: String, close: String, isClosed: Boolean },
    thursday: { open: String, close: String, isClosed: Boolean },
    friday: { open: String, close: String, isClosed: Boolean },
    saturday: { open: String, close: String, isClosed: Boolean },
    sunday: { open: String, close: String, isClosed: Boolean }
  },
  isOpen: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  isFeatured: { type: Boolean, default: false },
  deliveryTime: { type: String, default: '30-45 min' },
  deliveryFee: { type: Number, default: 30 },
  minOrderAmount: { type: Number, default: 100 },
  avgRating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  totalOrders: { type: Number, default: 0 },
  tags: [String],
  offers: [{
    title: String,
    description: String,
    discount: Number,
    minOrder: Number,
    code: String,
    validTill: Date
  }]
}, { timestamps: true });

restaurantSchema.index({ 'address.coordinates': '2dsphere' });
restaurantSchema.index({ name: 'text', cuisine: 'text', description: 'text' });

module.exports = mongoose.model('Restaurant', restaurantSchema);
