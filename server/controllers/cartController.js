import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import { memoryStore } from '../config/store.js';
import { getIsMongooseConnected } from '../config/db.js';

// @desc    Get user's cart
// @route   GET /api/cart
// @access  Private
export const getCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    if (getIsMongooseConnected()) {
      let cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
      if (!cart) {
        cart = await Cart.create({ user: req.user._id, items: [] });
      }
      return res.json(cart);
    } else {
      if (!memoryStore.carts[userId]) {
        memoryStore.carts[userId] = [];
      }
      return res.json({ items: memoryStore.carts[userId] });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving cart', error: error.message });
  }
};

// @desc    Add product to cart or update quantity
// @route   POST /api/cart
// @access  Private
export const addToCart = async (req, res) => {
  try {
    const { productId, qty = 1 } = req.body;
    const userId = req.user._id.toString();

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    if (getIsMongooseConnected()) {
      const product = await Product.findById(productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      let cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        cart = new Cart({ user: req.user._id, items: [] });
      }

      const existingIndex = cart.items.findIndex(item => item.product.toString() === productId);
      const targetQty = Number(qty);

      if (existingIndex > -1) {
        cart.items[existingIndex].qty += targetQty;
      } else {
        cart.items.push({
          product: productId,
          qty: targetQty,
          price: product.price,
        });
      }

      await cart.save();
      const populatedCart = await Cart.findById(cart._id).populate('items.product');
      return res.json(populatedCart);
    } else {
      const product = memoryStore.products.find(p => p._id === productId || p.id === productId);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      if (!memoryStore.carts[userId]) {
        memoryStore.carts[userId] = [];
      }

      const cartItems = memoryStore.carts[userId];
      const existing = cartItems.find(item => item.product._id === productId);

      if (existing) {
        existing.qty += Number(qty);
      } else {
        cartItems.push({
          product,
          qty: Number(qty),
          price: product.price,
        });
      }

      return res.json({ items: cartItems });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart', error: error.message });
  }
};

// @desc    Update quantity of product in cart
// @route   PUT /api/cart/:productId
// @access  Private
export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { qty } = req.body;
    const userId = req.user._id.toString();

    if (qty <= 0) {
      return removeCartItem(req, res);
    }

    if (getIsMongooseConnected()) {
      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart) return res.status(404).json({ message: 'Cart not found' });

      const item = cart.items.find(i => i.product.toString() === productId);
      if (item) {
        item.qty = Number(qty);
        await cart.save();
      }

      const populatedCart = await Cart.findById(cart._id).populate('items.product');
      return res.json(populatedCart);
    } else {
      const cartItems = memoryStore.carts[userId] || [];
      const item = cartItems.find(i => i.product._id === productId);
      if (item) {
        item.qty = Number(qty);
      }
      return res.json({ items: cartItems });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating cart item', error: error.message });
  }
};

// @desc    Remove product from cart
// @route   DELETE /api/cart/:productId
// @access  Private
export const removeCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id.toString();

    if (getIsMongooseConnected()) {
      const cart = await Cart.findOne({ user: req.user._id });
      if (!cart) return res.status(404).json({ message: 'Cart not found' });

      cart.items = cart.items.filter(i => i.product.toString() !== productId);
      await cart.save();

      const populatedCart = await Cart.findById(cart._id).populate('items.product');
      return res.json(populatedCart);
    } else {
      if (memoryStore.carts[userId]) {
        memoryStore.carts[userId] = memoryStore.carts[userId].filter(
          i => i.product._id !== productId
        );
      }
      return res.json({ items: memoryStore.carts[userId] || [] });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error removing cart item', error: error.message });
  }
};

// @desc    Clear user cart
// @route   DELETE /api/cart
// @access  Private
export const clearUserCart = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    if (getIsMongooseConnected()) {
      await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
      return res.json({ message: 'Cart cleared successfully', items: [] });
    } else {
      memoryStore.carts[userId] = [];
      return res.json({ message: 'Cart cleared successfully', items: [] });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error clearing cart', error: error.message });
  }
};
