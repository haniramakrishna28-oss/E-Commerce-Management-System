import express from 'express';
import { getAdminDashboardMetrics } from '../controllers/analyticsController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/dashboard', protect, admin, getAdminDashboardMetrics);

export default router;
