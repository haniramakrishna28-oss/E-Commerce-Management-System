import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Package,
  DollarSign,
  ShoppingCart,
  Users,
  Plus,
  Edit,
  Trash2,
  Check,
  Search,
  Filter,
  AlertCircle,
  X,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { productsAPI, ordersAPI, analyticsAPI } from '../services/api';
import {
  getStoredProducts,
  saveStoredProducts,
  addStoredProduct,
  updateStoredProduct,
  deleteStoredProduct,
} from '../services/productStorage';
import {
  cleanImageUrl,
  isLikelyWebpageUrl,
  readFileAsDataURL,
  getFallbackImage,
  CATEGORY_DEFAULT_IMAGES,
} from '../utils/imageHelpers';
import './Admin.css';

const Admin = () => {
  const { user, isAdmin, token } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('products');
  const [productsList, setProductsList] = useState(() => getStoredProducts());
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
  const [successMsg, setSuccessMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState('');
  const [imageWarning, setImageWarning] = useState('');
  const [imageLoadError, setImageLoadError] = useState(false);

  // Modal / Form state for Add/Edit product
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Desk Setup',
    price: '',
    countInStock: '10',
    description: '',
    image: getFallbackImage('Desk Setup'),
    featured: false,
  });

  // Order filters
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Load Products (Instant local load first)
      const cached = getStoredProducts();
      setProductsList(cached);
      let prods = cached;

      try {
        const prodRes = await productsAPI.getAll({ limit: 100 });
        if (prodRes?.products && prodRes.products.length > 0) {
          prods = prodRes.products;
          saveStoredProducts(prods);
          setProductsList(prods);
        }
      } catch (err) {
        console.warn('Backend API offline, keeping local product catalog');
      }

      // 2. Load Orders
      let orders = [];
      try {
        const orderRes = await ordersAPI.getAll();
        if (Array.isArray(orderRes)) {
          orders = orderRes;
          setOrdersList(orders);
        }
      } catch (e) {
        const localOrders = JSON.parse(localStorage.getItem('aura_orders') || '[]');
        orders = localOrders;
        setOrdersList(localOrders);
      }

      // 3. Load Metrics
      try {
        const metricsRes = await analyticsAPI.getDashboard();
        if (metricsRes) {
          setMetrics(metricsRes);
        }
      } catch (e) {
        const ords = orders.length ? orders : JSON.parse(localStorage.getItem('aura_orders') || '[]');
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
      setProductsList(getStoredProducts());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [token]);

  // Sync when products are updated in another tab or component
  useEffect(() => {
    const handleSync = () => {
      const updated = getStoredProducts();
      setProductsList(updated);
      setMetrics(prev => ({ ...prev, totalProducts: updated.length }));
    };
    window.addEventListener('aura_products_updated', handleSync);
    return () => window.removeEventListener('aura_products_updated', handleSync);
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setModalError('');
    setImageWarning('');
    setImageLoadError(false);
    setProductForm({
      name: '',
      category: 'Desk Setup',
      price: '',
      countInStock: '10',
      description: '',
      image: getFallbackImage('Desk Setup'),
      featured: false,
    });
    setShowProductModal(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setModalError('');
    setImageWarning('');
    setImageLoadError(false);
    const cat = product.category || 'Desk Setup';
    const cleanedImg = cleanImageUrl(product.image);
    setProductForm({
      name: product.name || '',
      category: cat,
      price: product.price !== undefined ? product.price : '',
      countInStock: product.countInStock !== undefined ? product.countInStock : '0',
      description: product.description || '',
      image: cleanedImg || getFallbackImage(cat),
      featured: !!product.featured,
    });
    setShowProductModal(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!productForm.name || !productForm.name.trim()) {
      setModalError('Product Name is required');
      return;
    }

    if (productForm.price === '' || isNaN(productForm.price) || Number(productForm.price) <= 0) {
      setModalError('Please enter a valid price greater than 0');
      return;
    }

    setSaving(true);

    const cleanPrice = Number(productForm.price);
    const cleanStock = Math.max(0, Number(productForm.countInStock) || 0);
    const cleanedImg = cleanImageUrl(productForm.image);
    const fallbackImage = getFallbackImage(productForm.category);

    const payload = {
      name: productForm.name.trim(),
      category: productForm.category || 'Desk Setup',
      price: cleanPrice,
      countInStock: cleanStock,
      description: productForm.description?.trim() || '',
      image: cleanedImg || fallbackImage,
      featured: Boolean(productForm.featured),
    };

    try {
      // 1. Attempt API sync (if backend is available)
      try {
        if (editingProduct) {
          const editId = editingProduct._id || editingProduct.id;
          await productsAPI.update(editId, payload);
        } else {
          await productsAPI.create(payload);
        }
      } catch (apiErr) {
        console.warn('Backend API save failed, synchronizing with local storage:', apiErr.message);
      }

      // 2. Always persist changes locally to guarantee instant and reliable saving
      let updated;
      if (editingProduct) {
        const editId = editingProduct._id || editingProduct.id;
        updated = updateStoredProduct(editId, payload);
        setSuccessMsg(`"${payload.name}" updated successfully!`);
      } else {
        addStoredProduct(payload);
        updated = getStoredProducts();
        setSuccessMsg(`"${payload.name}" added to catalog!`);
      }

      setProductsList(updated);
      setMetrics(prev => ({
        ...prev,
        totalProducts: updated.length,
      }));
      setShowProductModal(false);
      setEditingProduct(null);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Error saving product:', err);
      setModalError(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await productsAPI.delete(id);
      } catch (err) {
        console.warn('Backend delete failed, removing locally:', err.message);
      }

      const updated = deleteStoredProduct(id);
      setProductsList(updated);
      setMetrics(prev => ({
        ...prev,
        totalProducts: updated.length,
      }));
      setSuccessMsg('Product removed from catalog.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleUpdateStock = async (id, newStock) => {
    const stockVal = Math.max(0, Number(newStock) || 0);
    try {
      await productsAPI.update(id, { countInStock: stockVal });
    } catch (err) {
      console.warn('Stock update API offline, updating locally:', err.message);
    }

    const updated = updateStoredProduct(id, { countInStock: stockVal });
    setProductsList(updated);
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

        {successMsg && (
          <div
            style={{
              marginBottom: 'var(--space-6)',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: '#ecfdf5',
              color: '#065f46',
              borderRadius: '8px',
              border: '1px solid #a7f3d0',
              fontWeight: 500,
            }}
          >
            <Check size={18} />
            <span>{successMsg}</span>
          </div>
        )}

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
                {productsList.map(prod => {
                  const prodId = prod._id || prod.id;
                  return (
                    <tr key={prodId}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <img
                            src={cleanImageUrl(prod.image) || getFallbackImage(prod.category)}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '6px' }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = getFallbackImage(prod.category);
                            }}
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
                          value={prod.countInStock !== undefined ? prod.countInStock : 0}
                          onChange={(e) => handleUpdateStock(prodId, e.target.value)}
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
                          onClick={() => handleDeleteProduct(prodId)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: '#ef4444' }}
                          title="Delete Product"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
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
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: 'var(--space-4)',
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget && !saving) setShowProductModal(false);
            }}
          >
            <div
              className="card"
              style={{
                maxWidth: '540px',
                width: '100%',
                padding: 'var(--space-8)',
                maxHeight: '90vh',
                overflowY: 'auto',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
                <h2 style={{ fontSize: '1.4rem', margin: 0 }}>
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowProductModal(false)}
                  className="btn btn-ghost btn-sm"
                  aria-label="Close modal"
                  style={{ padding: '4px' }}
                >
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div
                  style={{
                    marginBottom: 'var(--space-4)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 14px',
                    background: '#fef2f2',
                    color: '#991b1b',
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    border: '1px solid #fecaca',
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleSaveProduct}>
                <div className="form-group">
                  <label className="form-label">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    placeholder="e.g. Chronos Minimalist Smartwatch"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      value={productForm.category}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        const isDefaultOrEmpty =
                          !productForm.image ||
                          Object.values(CATEGORY_DEFAULT_IMAGES).includes(productForm.image);
                        setProductForm({
                          ...productForm,
                          category: newCat,
                          image: isDefaultOrEmpty ? getFallbackImage(newCat) : productForm.image,
                        });
                        setImageLoadError(false);
                        setImageWarning('');
                      }}
                    >
                      <option value="Audio">Audio</option>
                      <option value="Wearables">Wearables</option>
                      <option value="Desk Setup">Desk Setup</option>
                      <option value="Photography">Photography</option>
                      <option value="Home Living">Home Living</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      placeholder="e.g. 29999"
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
                      placeholder="e.g. 10"
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

                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label className="form-label" style={{ margin: 0, fontWeight: 600 }}>Product Image</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        style={{ fontSize: '0.75rem', padding: '3px 8px', height: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => {
                          const sample = getFallbackImage(productForm.category);
                          setProductForm(prev => ({ ...prev, image: sample }));
                          setImageWarning('');
                          setImageLoadError(false);
                        }}
                      >
                        <Sparkles size={12} />
                        Use {productForm.category} Preset
                      </button>

                      <label
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '3px 10px', height: 'auto', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Upload size={12} />
                        Upload File
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const dataUrl = await readFileAsDataURL(file);
                              setProductForm(prev => ({ ...prev, image: dataUrl }));
                              setImageWarning('');
                              setImageLoadError(false);
                            } catch (err) {
                              setModalError(err.message);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={productForm.image}
                    onChange={(e) => {
                      const val = e.target.value;
                      const cleaned = cleanImageUrl(val);
                      if (cleaned !== val) {
                        setImageWarning('Direct image address extracted from Google link!');
                      } else if (isLikelyWebpageUrl(val)) {
                        setImageWarning('⚠️ It looks like you copied a webpage address instead of an image. In Google Images, right-click the image and choose "Copy image address", or click "Upload File" above.');
                      } else {
                        setImageWarning('');
                      }
                      setProductForm(prev => ({ ...prev, image: cleaned }));
                      setImageLoadError(false);
                    }}
                    placeholder="Paste image address (e.g. right-click on Google -> 'Copy image address')"
                  />

                  {/* Warning / Notification message */}
                  {imageWarning && (
                    <div
                      style={{
                        marginTop: '6px',
                        fontSize: '0.8rem',
                        color: imageWarning.startsWith('⚠️') ? '#b45309' : '#059669',
                        background: imageWarning.startsWith('⚠️') ? '#fef3c7' : '#ecfdf5',
                        padding: '6px 10px',
                        borderRadius: '4px',
                        border: `1px solid ${imageWarning.startsWith('⚠️') ? '#fde68a' : '#a7f3d0'}`,
                      }}
                    >
                      {imageWarning}
                    </div>
                  )}

                  {/* Live Image Preview Box */}
                  <div
                    style={{
                      marginTop: '10px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px dashed #cbd5e1',
                      background: '#f8fafc',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                    }}
                  >
                    <div
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '6px',
                        overflow: 'hidden',
                        background: '#e2e8f0',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        border: '1px solid #cbd5e1',
                      }}
                    >
                      {productForm.image ? (
                        <img
                          src={productForm.image}
                          alt="Preview"
                          referrerPolicy="no-referrer"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onLoad={() => setImageLoadError(false)}
                          onError={() => setImageLoadError(true)}
                        />
                      ) : (
                        <ImageIcon size={22} style={{ color: '#94a3b8' }} />
                      )}
                    </div>

                    <div style={{ flex: 1, fontSize: '0.82rem' }}>
                      <div style={{ fontWeight: 600, marginBottom: '2px' }}>
                        {imageLoadError ? (
                          <span style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <AlertCircle size={14} /> Image Failed to Load
                          </span>
                        ) : productForm.image ? (
                          <span style={{ color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={14} /> Image Preview Ready
                          </span>
                        ) : (
                          <span style={{ color: '#64748b' }}>No image selected</span>
                        )}
                      </div>

                      <div style={{ color: '#64748b', lineHeight: '1.3' }}>
                        {imageLoadError ? (
                          <span>
                            Did you click <em>"Copy link address"</em> in Google? Please right-click the image and select <strong>"Copy image address"</strong>, or click <strong>Upload File</strong>.
                          </span>
                        ) : (
                          <span>Right-click any image in Google & choose <strong>"Copy image address"</strong>, or upload a photo directly from your device.</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    rows="3"
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    placeholder="Describe product materials, craftsmanship and specifications..."
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-3)', marginTop: 'var(--space-6)' }}>
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="btn btn-outline"
                    disabled={saving}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Product'}
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
