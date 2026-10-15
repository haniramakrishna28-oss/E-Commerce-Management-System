import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { memoryStore } from '../config/store.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Support development and demo tokens
      if (token === 'mock-jwt-admin-token') {
        const adminUser = memoryStore.users.find(u => u.isAdmin) || {
          _id: '65f1a0010000000000000001',
          name: 'Alexander Admin',
          email: 'admin@aura.store',
          isAdmin: true,
        };
        req.user = adminUser;
        return next();
      }

      if (token === 'mock-jwt-customer-token' || token?.startsWith('mock-jwt-')) {
        const custUser = memoryStore.users.find(u => !u.isAdmin) || {
          _id: '65f1a0010000000000000002',
          name: 'Elena Rostova',
          email: 'customer@aura.store',
          isAdmin: false,
        };
        req.user = custUser;
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'aura_super_secure_jwt_secret_key_2026');

      // Check DB or memoryStore
      let user = null;
      try {
        user = await User.findById(decoded.id).select('-password');
      } catch (err) {
        // Fallback to memory store if db is offline
        user = memoryStore.users.find(u => u._id === decoded.id || u.id === decoded.id);
      }

      if (!user) {
        user = memoryStore.users.find(u => u._id === decoded.id || u.id === decoded.id);
      }

      if (!user) {
        return res.status(401).json({ message: 'User not found or authorization revoked' });
      }

      req.user = user;
      return next();
    } catch (error) {
      console.error('JWT verification error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed or expired' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no bearer token provided' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.isAdmin) {
    next();
  } else {
    res.status(403).json({ message: 'Access denied: Admin privileges required' });
  }
};
