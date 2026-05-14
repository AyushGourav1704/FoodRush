const express = require('express');
const router = express.Router();
const { createReview, getRestaurantReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createReview);
router.get('/restaurant/:restaurantId', getRestaurantReviews);

module.exports = router;
