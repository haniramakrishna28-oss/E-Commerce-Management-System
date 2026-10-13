import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearUserCart,
} from '../controllers/cartController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // All cart routes require user authentication

router.route('/')
  .get(getCart)
  .post(addToCart)
  .delete(clearUserCart);

router.route('/:productId')
  .put(updateCartItem)
  .delete(removeCartItem);

export default router;
