import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, DollarSign, ShoppingCart, Users, Plus, Edit, Trash2, Check, Search, Filter, AlertCircle } from 'lucide-react';
import { mockProducts } from '../services/mockData';
import { useAuth } from '../context/AuthContext';
import { productsAPI, ordersAPI, analyticsAPI } from '../services/api';
import './Admin.css';

const Admin = () => {
  const { user, isAdmin, token } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('products');
  const [productsList, setProductsList] = useState([]);
  const [ordersList, setOrdersList] = useState([]);
  const [metrics, setMetrics] = useState({
    totalProducts: 0,
    totalUsers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
  });
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal / Form state for Add/Edit product
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Audio',
    price: '',
    countInStock: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    featured: false,
  });

  // Order filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Products
      const prodRes = await productsAPI.getAll({ limit: 100 });
      if (prodRes?.products) {
        setProductsList(prodRes.products);
      } else {
        setProductsList(mockProducts);
      }

      // 2. Load Orders
      try {
        const orderRes = await ordersAPI.getAll();
        if (Array.isArray(orderRes)) {
          setOrdersList(orderRes);
        }
      } catch (e) {
        const localOrders = JSON.parse(localStorage.getItem('aura_orders') || '[]');
        setOrdersList(localOrders);
      }

      // 3. Load Metrics
      try {
        const metricsRes = await analyticsAPI.getDashboard();
        if (metricsRes) {
          setMetrics(metricsRes);
        }
      } catch (e) {
        // Calculate locally
        const prods = prodRes?.products || mockProducts;
        const ords = JSON.parse(localStorage.getItem('aura_orders') || '[]');
        const rev = ords.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
        setMetrics({
          totalProducts: prods.length,
          totalUsers: 2,
          totalOrders: ords.length,
          totalRevenue: rev,
          pendingOrders: ords.filter(o => o.status === 'Order Placed' || !o.status).length,
        });
      }
    } catch (err) {
      console.warn('Admin load data error:', err.message);
      setProductsList(mockProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'Audio',
      price: '',
      countInStock: '10',
      description: '',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
      featured: false,
    });
    setShowProductModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      category: product.category,
      price: product.price,
      countInStock: product.countInStock,
      description: product.description,
      image: product.image,
      featured: !!product.featured,
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    try {
      if (editingProduct) {
        await productsAPI.update(editingProduct._id, {
          name: productForm.name,
          category: productForm.category,
          price: Number(productForm.price),
          countInStock: Number(productForm.countInStock),
          description: productForm.description,
          image: productForm.image,
          featured: productForm.featured,
        });
      } else {
        await productsAPI.create({
          name: productForm.name,
          category: productForm.category,
          price: Number(productForm.price),
          countInStock: Number(productForm.countInStock),
          description: productForm.description,
          image: productForm.image,
          featured: productForm.featured,
        });
      }
      setShowProductModal(false);
      loadData();
    } catch (err) {
      setErrorMsg(err.message || 'Error saving product');
      setTimeout(() => setErrorMsg(''), 4000);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
        loadData();
      } catch (err) {
        setErrorMsg(err.message || 'Error deleting product');
        setTimeout(() => setErrorMsg(''), 4000);
      }
    }
  };

  const handleUpdateStock = async (id, newStock) => {
    const stockVal = Math.max(0, Number(newStock));
    try {
      await productsAPI.update(id, { countInStock: stockVal });
      setProductsList(prev =>
        prev.map(p => (p._id === id ? { ...p, countInStock: stockVal } : p))
      );
    } catch (err) {
      console.warn('Stock update error:', err.message);
    }
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
      await ordersAPI.updateStatus(orderId, newStatus);
      loadData();
    } catch (err) {
      console.warn('Status update error, falling back locally:', err.message);
      const updated = ordersList.map(o => (o._id === orderId ? { ...o, status: newStatus } : o));
      setOrdersList(updated);
      localStorage.setItem('aura_orders', JSON.stringify(updated));
    }
  };

  const filteredOrders = ordersList.filter(o => {
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchId = (o.orderNumber || o._id)?.toLowerCase().includes(q);
      const matchCustomer = o.shippingAddress?.name?.toLowerCase().includes(q);
      if (!matchId && !matchCustomer) return false;
    }
    return true;
  });

  return (
    <div className="admin-page">
      <div className="container page-wrapper">
        <div className="admin-header">
          <div>
            <h1 className="page-title">Admin Operations Console</h1>
            <p className="page-subtitle">Product catalog, inventory control, and fulfillment dispatch.</p>
          </div>
          {activeTab === 'products' && (
            <button onClick={handleOpenAddModal} className="btn btn-primary">
              <Plus size={18} /> Add New Product
            </button>
          )}
        </div>

        {errorMsg && (
          <div className="alert-error" style={{ marginBottom: 'var(--space-6)' }}>
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Overview Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-card-title">Total Products</div>
            <div className="stat-card-value">{metrics.totalProducts || productsList.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Total Orders</div>
            <div className="stat-card-value">{metrics.totalOrders || ordersList.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Total Revenue</div>
            <div className="stat-card-value">₹{Number(metrics.totalRevenue || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          </div>
          <div className="stat-card">
            <div className="stat-card-title">Pending Orders</div>
            <div className="stat-card-value" style={{ color: metrics.pendingOrders > 0 ? '#f59e0b' : 'inherit' }}>
              {metrics.pendingOrders}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Products & Stock ({productsList.length})
          </button>
          <button
            className={`admin-tab ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            Customer Orders ({ordersList.length})
          </button>
        </div>

        {/* Tab 1: Products */}
        {activeTab === 'products' && (
          <div className="card" style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Available</th>
                  <th>Featured</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {productsList.map(prod => (
                  <tr key={prod._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img
                          src={prod.image}
                          alt={prod.name}
                          style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                        />
                        <span style={{ fontWeight: 600 }}>{prod.name}</span>
                      </div>
                    </td>
                    <td>{prod.category}</td>
                    <td><strong>₹{Number(prod.price).toLocaleString('en-IN')}</strong></td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        value={prod.countInStock}
                        onChange={(e) => handleUpdateStock(prod._id, e.target.value)}
                        style={{ width: '70px', padding: '4px 8px', fontSize: '0.85rem' }}
                      />
                    </td>
                    <td>
                      {prod.featured ? <span className="badge badge-brand">Yes</span> : <span className="badge badge-muted">No</span>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        onClick={() => handleOpenEditModal(prod)}
                        className="btn btn-ghost btn-sm"
                        title="Edit Product"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod._id)}
                        className="btn btn-ghost btn-sm"
                        style={{ color: '#ef4444' }}
                        title="Delete Product"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Orders */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-4)', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="Search by Order ID or Customer name..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                style={{ maxWidth: '320px' }}
              />
              <select
                value={orderStatusFilter}
                onChange={(e) => setOrderStatusFilter(e.target.value)}
                style={{ maxWidth: '200px' }}
              >
                <option value="all">All Statuses</option>
                <option value="Order Placed">Order Placed</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Update Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length > 0 ? (
                    filteredOrders.map(order => (
                      <tr key={order._id || order.orderNumber}>
                        <td><strong>{order.orderNumber || order._id}</strong></td>
                        <td>{order.shippingAddress?.name || 'Customer'}</td>
                        <td>{order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Recent'}</td>
                        <td><strong>₹{Number(order.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                        <td>
                          <span className={`badge ${order.status === 'Delivered' ? 'badge-success' : order.status === 'Cancelled' ? 'badge-danger' : 'badge-brand'}`}>
                            {order.status || 'Order Placed'}
                          </span>
                        </td>
                        <td>
                          <select
                            value={order.status || 'Order Placed'}
                            onChange={(e) => handleOrderStatusChange(order._id, e.target.value)}
                            style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                          >
                            <option value="Order Placed">Order Placed</option>
                            <option value="Confirmed">Confirmed</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: 'var(--space-8)' }}>
                        No orders matching current filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Modal for Add / Edit Product */}
        {showProductModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 'var(--space-4)' }}>
            <div className="card" style={{ maxWidth: '540px', width: '100%', padding: 'var(--space-8)', maxHeight: '90vh', overflowY: 'auto' }}>
              <h2 style={{ marginBottom: 'var(--space-4)', fontSize: '1.4rem' }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <form onSubmit={handleSaveProduct}>
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    >
                      <option value="Audio">Audio</option>
                      <option value="Wearables">Wearables</option>
                      <option value="Desk Setup">Desk Setup</option>
                      <option value="Photography">Photography</option>
                      <option value="Home Living">Home Living</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (₹)</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Stock Units</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={productForm.countInStock}
                      onChange={(e) => setProductForm({ ...productForm, countInStock: e.target.value })}
                    />
                  </div>

                  <div className="form-group" style={{ display: 'flex', alignItems: 'center', paddingTop: '28px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={productForm.featured}
                        onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })}
                        style={{ width: 'auto' }}
                      />
                      <span style={{ fontSize: '0.9rem' }}>Featured Product</span>
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input
                    type="url"
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows="3"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                  <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-outline">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
