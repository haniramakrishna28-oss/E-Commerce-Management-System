import Product from '../models/Product.js';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { memoryStore } from '../config/store.js';
import { getIsMongooseConnected } from '../config/db.js';

// @desc    Get aggregate metrics for admin dashboard
// @route   GET /api/admin/dashboard
// @access  Private/Admin
export const getAdminDashboardMetrics = async (req, res) => {
  try {
    if (getIsMongooseConnected()) {
      const totalProducts = await Product.countDocuments();
      const totalUsers = await User.countDocuments();
      const totalOrders = await Order.countDocuments();

      const orders = await Order.find();
      const totalRevenue = orders.reduce((sum, order) => sum + (order.totalPrice || 0), 0);
      const pendingOrders = orders.filter(o => o.status === 'Order Placed' || !o.status).length;

      return res.json({
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        pendingOrders,
      });
    } else {
      const totalProducts = memoryStore.products.length;
      const totalUsers = memoryStore.users.length;
      const totalOrders = memoryStore.orders.length;
      const totalRevenue = memoryStore.orders.reduce(
        (sum, order) => sum + (order.totalPrice || 0),
        0
      );
      const pendingOrders = memoryStore.orders.filter(
        o => o.status === 'Order Placed' || !o.status
      ).length;

      return res.json({
        totalProducts,
        totalUsers,
        totalOrders,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        pendingOrders,
      });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving dashboard metrics', error: error.message });
  }
};
