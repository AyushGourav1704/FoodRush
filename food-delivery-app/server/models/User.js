const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
  label: { type: String, default: 'Home' },
  street: String,
  city: String,
  state: String,
  zipCode: String,
  country: { type: String, default: 'India' },
  coordinates: {
    lat: Number,
    lng: Number
  },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: [true, 'Name is required'], trim: true },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  phone: { type: String, trim: true },
  role: {
    type: String,
    enum: ['customer', 'admin', 'delivery', 'restaurant_owner'],
    default: 'customer'
  },
  avatar: { type: String, default: '' },
  addresses: [addressSchema],
  wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
  isActive: { type: Boolean, default: true },
  isEmailVerified: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  fcmToken: String, // For push notifications
  refreshToken: String,
  lastLogin: Date
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Return user without sensitive fields
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.refreshToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
