const express = require('express');
const router = express.Router();
const { register, login, getProfile, updateProfile, refreshToken, logout, changePassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);
router.post('/logout', protect, logout);
router.put('/change-password', protect, changePassword);

module.exports = router;
