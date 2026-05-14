const FoodItem = require('../models/FoodItem');
const { uploadToCloudinary } = require('../utils/cloudinary');

exports.getFoods = async (req, res) => {
  try {
    const { restaurant, category, isVeg, search, featured, page = 1, limit = 20 } = req.query;
    const query = { isAvailable: true };

    if (restaurant) query.restaurant = restaurant;
    if (category) query.category = category;
    if (isVeg !== undefined) query.isVeg = isVeg === 'true';
    if (featured === 'true') query.isFeatured = true;
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await FoodItem.countDocuments(query);
    const foods = await FoodItem.find(query)
      .populate('restaurant', 'name image avgRating deliveryTime')
      .populate('category', 'name icon')
      .sort({ isBestseller: -1, 'ratings.avg': -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, data: foods, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit) } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFood = async (req, res) => {
  try {
    const food = await FoodItem.findById(req.params.id)
      .populate('restaurant', 'name image avgRating deliveryTime deliveryFee address')
      .populate('category', 'name icon');
    if (!food) return res.status(404).json({ success: false, message: 'Food item not found' });
    res.json({ success: true, data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createFood = async (req, res) => {
  try {
    let imageUrl = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'foods');
      imageUrl = result.secure_url;
    }
    const food = await FoodItem.create({ ...req.body, image: imageUrl });
    res.status(201).json({ success: true, message: 'Food item created', data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateFood = async (req, res) => {
  try {
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'foods');
      req.body.image = result.secure_url;
    }
    const food = await FoodItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!food) return res.status(404).json({ success: false, message: 'Food item not found' });
    res.json({ success: true, message: 'Food item updated', data: food });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteFood = async (req, res) => {
  try {
    const food = await FoodItem.findByIdAndDelete(req.params.id);
    if (!food) return res.status(404).json({ success: false, message: 'Food item not found' });
    res.json({ success: true, message: 'Food item deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
