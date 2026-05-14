const express = require('express');
const router = express.Router();
const { getFoods, getFood, createFood, updateFood, deleteFood } = require('../controllers/foodController');
const { protect, authorize } = require('../middleware/auth');
const { upload } = require('../utils/cloudinary');

router.get('/', getFoods);
router.get('/:id', getFood);
router.post('/', protect, authorize('admin', 'restaurant_owner'), upload.single('image'), createFood);
router.put('/:id', protect, authorize('admin', 'restaurant_owner'), upload.single('image'), updateFood);
router.delete('/:id', protect, authorize('admin', 'restaurant_owner'), deleteFood);

module.exports = router;
