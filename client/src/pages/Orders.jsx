import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Package, Clock, ArrowRight, CheckCircle2, Truck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import { cleanImageUrl, getFallbackImage } from '../utils/imageHelpers';

const Orders = () => {
  const { user, token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setOrders([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        if (token) {
          const apiOrders = await ordersAPI.getMyOrders();
          if (Array.isArray(apiOrders)) {
            setOrders(apiOrders);
            return;
          }
        }
      } catch (err) {
        console.warn('API order fetch error, reading local orders:', err.message);
      } finally {
        setLoading(false);
      }

      // Fallback to local storage for offline / mock mode
      try {
        const saved = JSON.parse(localStorage.getItem('aura_orders') || '[]');
        const filtered = user?.isAdmin
          ? saved
          : saved.filter(
              o =>
                (o.shippingAddress?.email && o.shippingAddress.email.toLowerCase() === user.email?.toLowerCase()) ||
                o.user === user._id
            );
        setOrders(filtered);
      } catch {
        setOrders([]);
      }
    };

    fetchOrders();
  }, [token, user]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Delivered':
        return <span className="badge badge-success">{status}</span>;
      case 'Shipped':
        return <span className="badge badge-brand">{status}</span>;
      case 'Cancelled':
        return <span className="badge badge-danger">{status}</span>;
      default:
        return <span className="badge badge-muted">{status || 'Order Placed'}</span>;
    }
  };

  if (loading) {
    return (
      <div className="container page-wrapper" style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
        <div className="loading-spinner"></div>
        <p style={{ marginTop: 'var(--space-4)', color: 'var(--text-secondary)' }}>Retrieving your order records...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container page-wrapper">
        <div className="state-container">
          <Package className="state-icon" />
          <h2 className="state-title">No orders placed yet</h2>
          <p className="state-desc">When you complete a purchase, your tracked orders will appear here.</p>
          <Link to="/products" className="btn btn-primary">
            Explore Collection <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-wrapper">
      <div className="page-header" style={{ marginBottom: 'var(--space-8)' }}>
        <h1 className="page-title">Order History</h1>
        <p className="page-subtitle">Track dispatch status, invoices, and purchase records.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
        {orders.map(order => (
          <div key={order._id || order.orderNumber} className="card" style={{ padding: 'var(--space-6)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-3)', borderBottom: '1px solid var(--border-light)', paddingBottom: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ORDER NUMBER</span>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>{order.orderNumber || order._id}</div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DATE PLACED</span>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recent'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>TOTAL</span>
                <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
                  ₹{Number(order.totalPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              <div>
                {getStatusBadge(order.status)}
              </div>
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
              {order.orderItems?.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                  <img
                    src={cleanImageUrl(item.image || item.product?.image) || getFallbackImage(item.category || item.product?.category)}
                    alt={item.name || item.product?.name}
                    referrerPolicy="no-referrer"
                    style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = getFallbackImage(item.category || item.product?.category);
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name || item.product?.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Qty: {item.qty} × ₹{Number(item.price).toLocaleString('en-IN')}</div>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    ₹{Number(item.qty * item.price).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-secondary)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
              <strong>Ship to:</strong> {order.shippingAddress?.name || 'Customer'} — {order.shippingAddress?.address}, {order.shippingAddress?.city}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Orders;
