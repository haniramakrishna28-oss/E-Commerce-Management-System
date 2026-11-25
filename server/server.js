import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import { connectDB } from './config/db.js';
import { seedIfEmpty } from './config/seed.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to Database and seed initial catalog/users if collections are empty
const dbConnected = await connectDB();
if (dbConnected) {
  await seedIfEmpty();
}

// Core Middleware
const normalizeOrigin = (url) => (url ? url.trim().replace(/\/+$/, '') : '');
const envOrigins = (process.env.CLIENT_URL || '')
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);
const allowedOrigins = new Set([
  'http://localhost:5173',
  'https://e-commerce-management-system-rho.vercel.app',
  ...envOrigins,
]);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
      return callback(null, true);
    }
    return callback(new Error(`Not allowed by CORS: ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'AURA E-Commerce REST API',
    version: '1.0.0',
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', analyticsRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('AURA E-Commerce API is running gracefully.');
});

// 404 Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({ message: `Endpoint Not Found - ${req.originalUrl}` });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

app.listen(PORT, () => {
  console.log(`[AURA Server] Running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
});

export default app;
