const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  foodItem: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodItem', required: true },
  name: String,
  image: String,
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  customizations: [{
    title: String,
    selected: [{ name: String, price: Number }]
  }],
  subtotal: Number
});

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  items: [orderItemSchema],
  deliveryAddress: {
    label: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: { lat: Number, lng: Number }
  },
  orderStatus: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  statusHistory: [{
    status: String,
    timestamp: { type: Date, default: Date.now },
    note: String
  }],
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deliveryPartnerLocation: {
    lat: Number,
    lng: Number,
    updatedAt: Date
  },
  pricing: {
    subtotal: Number,
    deliveryFee: { type: Number, default: 30 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: Number
  },
  couponCode: String,
  paymentMethod: { type: String, enum: ['razorpay', 'stripe', 'cod'], default: 'cod' },
  paymentStatus: { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paymentId: String,
  razorpayOrderId: String,
  estimatedDeliveryTime: Date,
  actualDeliveryTime: Date,
  specialInstructions: String,
  isRated: { type: Boolean, default: false },
  cancelReason: String,
  cancelledBy: { type: String, enum: ['customer', 'restaurant', 'admin'] }
}, { timestamps: true });

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `FD${Date.now()}${count + 1}`.slice(0, 15);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
