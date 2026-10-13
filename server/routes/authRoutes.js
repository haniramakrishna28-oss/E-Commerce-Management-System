import express from 'express';
import {
  registerUser,
  loginUser,
  getUserProfile,
  toggleWishlistItem,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.post('/wishlist/:productId', protect, toggleWishlistItem);

export default router;
