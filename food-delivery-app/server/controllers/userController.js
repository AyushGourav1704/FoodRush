const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

exports.addAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (req.body.isDefault) user.addresses.forEach(a => a.isDefault = false);
    user.addresses.push(req.body);
    await user.save();
    res.json({ success: true, message: 'Address added', data: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.addresses = user.addresses.filter(a => a._id.toString() !== req.params.addressId);
    await user.save();
    res.json({ success: true, message: 'Address deleted', data: user.addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const restaurantId = req.params.restaurantId;
    const index = user.wishlist.indexOf(restaurantId);
    if (index > -1) user.wishlist.splice(index, 1);
    else user.wishlist.push(restaurantId);
    await user.save();
    res.json({ success: true, message: index > -1 ? 'Removed from wishlist' : 'Added to wishlist', data: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('wishlist', 'name image cuisine avgRating deliveryTime deliveryFee isOpen');
    res.json({ success: true, data: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
