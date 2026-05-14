const express = require('express');
const router = express.Router();
const { addAddress, deleteAddress, toggleWishlist, getWishlist } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.post('/addresses', protect, addAddress);
router.delete('/addresses/:addressId', protect, deleteAddress);
router.post('/wishlist/:restaurantId', protect, toggleWishlist);
router.get('/wishlist', protect, getWishlist);

module.exports = router;
