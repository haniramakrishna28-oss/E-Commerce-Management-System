import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { memoryStore } from '../config/store.js';
import { getIsMongooseConnected } from '../config/db.js';

// Helper to generate unique order ID
const generateOrderNumber = () => {
  return 'ORD-' + Math.floor(100000 + Math.random() * 900000);
};

// @desc    Create new order & reduce product stock
// @route   POST /api/orders
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const {
      orderItems,
      shippingAddress,
      paymentMethod = 'card',
      subtotal,
      shippingPrice,
      taxPrice,
      totalPrice,
    } = req.body;

    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ message: 'No items in order' });
    }

    if (!shippingAddress || !shippingAddress.address || !shippingAddress.city) {
      return res.status(400).json({ message: 'Shipping address details are required' });
    }

    const orderNumber = generateOrderNumber();

    if (getIsMongooseConnected()) {
      // 1. Verify stock availability and reduce stock
      for (const item of orderItems) {
        const prod = await Product.findById(item.product);
        if (!prod) {
          return res.status(404).json({ message: `Product ${item.name} not found` });
        }
        if (prod.countInStock < item.qty) {
          return res.status(400).json({
            message: `Insufficient inventory for ${prod.name}. Available: ${prod.countInStock}, Requested: ${item.qty}`,
          });
        }
        prod.countInStock -= item.qty;
        await prod.save();
      }

      const order = new Order({
        user: req.user._id,
        orderNumber,
        orderItems,
        shippingAddress,
        paymentMethod,
        subtotal: Number(subtotal),
        shippingPrice: Number(shippingPrice),
        taxPrice: Number(taxPrice),
        totalPrice: Number(totalPrice),
        status: 'Order Placed',
        isPaid: true,
      });

      const createdOrder = await order.save();
      return res.status(201).json(createdOrder);
    } else {
      // Memory Store fallback
      for (const item of orderItems) {
        const prodId = typeof item.product === 'object' ? item.product._id : item.product;
        const prod = memoryStore.products.find(p => p._id === prodId || p.id === prodId);
        if (!prod) {
          return res.status(404).json({ message: `Product ${item.name} not found` });
        }
        if (prod.countInStock < item.qty) {
          return res.status(400).json({
            message: `Insufficient inventory for ${prod.name}. Available: ${prod.countInStock}, Requested: ${item.qty}`,
          });
        }
        prod.countInStock -= item.qty;
      }

      const newOrder = {
        _id: 'ord-' + Date.now(),
        orderNumber,
        user: req.user._id,
        orderItems,
        shippingAddress,
        paymentMethod,
        subtotal: Number(subtotal),
        shippingPrice: Number(shippingPrice),
        taxPrice: Number(taxPrice),
        totalPrice: Number(totalPrice),
        status: 'Order Placed',
        isPaid: true,
        createdAt: new Date().toISOString(),
      };

      memoryStore.orders.unshift(newOrder);
      return res.status(201).json(newOrder);
    }
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ message: 'Server error creating order', error: error.message });
  }
};

// @desc    Get logged-in user order history
// @route   GET /api/orders/myorders
// @access  Private
export const getMyOrders = async (req, res) => {
  try {
    const userId = req.user._id.toString();

    if (getIsMongooseConnected()) {
      const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
      return res.json(orders);
    } else {
      const orders = memoryStore.orders.filter(
        o => o.user?.toString() === userId || o.user === userId
      );
      return res.json(orders);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving user orders', error: error.message });
  }
};

// @desc    Get single order by ID
// @route   GET /api/orders/:id
// @access  Private
export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (getIsMongooseConnected()) {
      const order = await Order.findById(id).populate('user', 'name email');
      if (!order) return res.status(404).json({ message: 'Order not found' });
      return res.json(order);
    } else {
      const order = memoryStore.orders.find(o => o._id === id || o.orderNumber === id);
      if (!order) return res.status(404).json({ message: 'Order not found' });
      return res.json(order);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving order', error: error.message });
  }
};

// @desc    Get all orders (Admin view with search & status filters)
// @route   GET /api/orders
// @access  Private/Admin
export const getAllOrders = async (req, res) => {
  try {
    const { search, status, date } = req.query;

    if (getIsMongooseConnected()) {
      const query = {};
      if (status && status !== 'all') {
        query.status = status;
      }
      if (search) {
        query.$or = [
          { orderNumber: { $regex: search, $options: 'i' } },
          { 'shippingAddress.name': { $regex: search, $options: 'i' } },
        ];
      }

      const orders = await Order.find(query).sort({ createdAt: -1 });
      return res.json(orders);
    } else {
      let filtered = [...memoryStore.orders];

      if (status && status !== 'all') {
        filtered = filtered.filter(o => o.status === status);
      }
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          o =>
            o.orderNumber?.toLowerCase().includes(q) ||
            o.shippingAddress?.name?.toLowerCase().includes(q)
        );
      }

      return res.json(filtered);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving all orders', error: error.message });
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Order Placed', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    if (getIsMongooseConnected()) {
      const order = await Order.findById(id);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      order.status = status;
      if (status === 'Delivered') {
        order.deliveredAt = Date.now();
      }
      const updated = await order.save();
      return res.json(updated);
    } else {
      const order = memoryStore.orders.find(o => o._id === id || o.orderNumber === id);
      if (!order) return res.status(404).json({ message: 'Order not found' });

      order.status = status;
      return res.json(order);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error updating order status', error: error.message });
  }
};
