import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { memoryStore } from '../config/store.js';
import { getIsMongooseConnected } from '../config/db.js';

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'aura_super_secure_jwt_secret_key_2026', {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      return res.status(400).json({ message: 'Please provide a valid email address' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (getIsMongooseConnected()) {
      const userExists = await User.findOne({ email: normalizedEmail });
      if (userExists) {
        return res.status(400).json({ message: 'User already exists with this email address' });
      }

      const user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        password,
        isAdmin: false,
      });

      return res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        isAdmin: user.isAdmin,
        token: generateToken(user._id),
      });
    } else {
      // Memory Store fallback
      const userExists = memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (userExists) {
        return res.status(400).json({ message: 'User already exists with this email address' });
      }

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword = bcrypt.hashSync(password, salt);
      const newUserId = 'user-' + Date.now();

      const newUser = {
        _id: newUserId,
        id: newUserId,
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        isAdmin: false,
        wishlist: [],
        createdAt: new Date().toISOString(),
      };

      memoryStore.users.push(newUser);

      return res.status(201).json({
        _id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        isAdmin: newUser.isAdmin,
        token: generateToken(newUser._id),
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration', error: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (getIsMongooseConnected()) {
      const user = await User.findOne({ email: normalizedEmail });
      if (user && (await user.matchPassword(password))) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          token: generateToken(user._id),
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    } else {
      // Memory Store fallback
      const user = memoryStore.users.find(u => u.email.toLowerCase() === normalizedEmail);
      if (user && bcrypt.compareSync(password, user.password)) {
        return res.json({
          _id: user._id,
          name: user.name,
          email: user.email,
          isAdmin: user.isAdmin,
          token: generateToken(user._id),
        });
      } else {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login', error: error.message });
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
export const getUserProfile = async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    email: req.user.email,
    isAdmin: req.user.isAdmin,
    wishlist: req.user.wishlist || [],
  });
};

// @desc    Toggle item in wishlist
// @route   POST /api/auth/wishlist/:productId
// @access  Private
export const toggleWishlistItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const user = req.user;

    if (getIsMongooseConnected()) {
      const dbUser = await User.findById(user._id);
      const index = dbUser.wishlist.indexOf(productId);
      if (index > -1) {
        dbUser.wishlist.splice(index, 1);
      } else {
        dbUser.wishlist.push(productId);
      }
      await dbUser.save();
      return res.json({ wishlist: dbUser.wishlist });
    } else {
      const memUser = memoryStore.users.find(u => u._id === user._id);
      if (!memUser.wishlist) memUser.wishlist = [];
      const idx = memUser.wishlist.indexOf(productId);
      if (idx > -1) {
        memUser.wishlist.splice(idx, 1);
      } else {
        memUser.wishlist.push(productId);
      }
      return res.json({ wishlist: memUser.wishlist });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating wishlist', error: error.message });
  }
};
