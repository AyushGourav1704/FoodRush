const Restaurant = require('../models/Restaurant');
const FoodItem = require('../models/FoodItem');
const { uploadToCloudinary } = require('../utils/cloudinary');

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
exports.getRestaurants = async (req, res) => {
  try {
    const { search, cuisine, category, isOpen, featured, page = 1, limit = 12, sort = 'avgRating' } = req.query;

    const query = { isActive: true };

    if (search) query.$text = { $search: search };
    if (cuisine) query.cuisine = { $in: cuisine.split(',') };
    if (category) query.categories = category;
    if (isOpen !== undefined) query.isOpen = isOpen === 'true';
    if (featured === 'true') query.isFeatured = true;

    const sortOptions = {
      rating: { avgRating: -1 },
      deliveryTime: { deliveryTime: 1 },
      deliveryFee: { deliveryFee: 1 },
      popular: { totalOrders: -1 }
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Restaurant.countDocuments(query);
    const restaurants = await Restaurant.find(query)
      .populate('categories', 'name icon')
      .sort(sortOptions[sort] || { avgRating: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: restaurants,
      pagination: { total, page: parseInt(page), limit: parseInt(limit), pages: Math.ceil(total / limit) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single restaurant with menu
// @route   GET /api/restaurants/:id
// @access  Public
exports.getRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).populate('categories', 'name icon');
    if (!restaurant) {
      return res.status(404).json({ success: false, message: 'Restaurant not found' });
    }

    const menu = await FoodItem.find({ restaurant: req.params.id, isAvailable: true })
      .populate('category', 'name icon')
      .sort({ isBestseller: -1, 'ratings.avg': -1 });

    res.json({ success: true, data: { restaurant, menu } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create restaurant
// @route   POST /api/restaurants
// @access  Private (admin/restaurant_owner)
exports.createRestaurant = async (req, res) => {
  try {
    let imageUrl = '';
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'restaurants');
      imageUrl = result.secure_url;
    }

    const restaurant = await Restaurant.create({
      ...req.body,
      image: imageUrl,
      owner: req.user._id
    });

    res.status(201).json({ success: true, message: 'Restaurant created', data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private
exports.updateRestaurant = async (req, res) => {
  try {
    let restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, 'restaurants');
      req.body.image = result.secure_url;
    }

    restaurant = await Restaurant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    res.json({ success: true, message: 'Restaurant updated', data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private (admin)
exports.deleteRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findByIdAndDelete(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    await FoodItem.deleteMany({ restaurant: req.params.id });
    res.json({ success: true, message: 'Restaurant deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle restaurant open/close
// @route   PUT /api/restaurants/:id/toggle
// @access  Private
exports.toggleRestaurant = async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, message: 'Restaurant not found' });
    restaurant.isOpen = !restaurant.isOpen;
    await restaurant.save();
    res.json({ success: true, message: `Restaurant is now ${restaurant.isOpen ? 'open' : 'closed'}`, data: restaurant });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
