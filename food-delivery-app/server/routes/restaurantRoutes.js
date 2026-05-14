const express = require('express');
const router = express.Router();
const { getRestaurants, getRestaurant, createRestaurant, updateRestaurant, deleteRestaurant, toggleRestaurant } = require('../controllers/restaurantController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

router.get('/', getRestaurants);
router.get('/:id', getRestaurant);
router.post('/', protect, authorize('admin', 'restaurant_owner'), upload.single('image'), createRestaurant);
router.put('/:id', protect, authorize('admin', 'restaurant_owner'), upload.single('image'), updateRestaurant);
router.delete('/:id', protect, authorize('admin'), deleteRestaurant);
router.put('/:id/toggle', protect, authorize('admin', 'restaurant_owner'), toggleRestaurant);

module.exports = router;
