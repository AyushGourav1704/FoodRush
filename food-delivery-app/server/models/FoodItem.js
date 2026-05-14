const mongoose = require('mongoose');

const foodItemSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  discountedPrice: { type: Number, min: 0 },
  image: { type: String, default: '' },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' },
  isVeg: { type: Boolean, default: false },
  isAvailable: { type: Boolean, default: true },
  isBestseller: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  spiceLevel: { type: String, enum: ['mild', 'medium', 'hot', 'extra-hot'], default: 'mild' },
  calories: Number,
  prepTime: { type: Number, default: 15 }, // minutes
  ingredients: [String],
  allergens: [String],
  tags: [String],
  ratings: {
    avg: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  customizations: [{
    title: String,
    required: Boolean,
    multiSelect: Boolean,
    options: [{
      name: String,
      price: { type: Number, default: 0 }
    }]
  }]
}, { timestamps: true });

foodItemSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('FoodItem', foodItemSchema);
