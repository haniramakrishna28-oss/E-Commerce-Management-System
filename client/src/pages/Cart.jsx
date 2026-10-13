import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import './Cart.css';

const Cart = () => {
  const { cartItems, updateQty, removeFromCart, clearCart, subtotal, shipping, tax, total } = useCart();
  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container page-wrapper">
          <div className="state-container">
            <ShoppingBag className="state-icon" />
            <h2 className="state-title">Your shopping bag is empty</h2>
            <p className="state-desc">
              Explore our minimalist catalog and discover refined hardware, audio, and desk setup pieces.
            </p>
            <Link to="/products" className="btn btn-primary">
              Discover Products <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container page-wrapper">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-6)' }}>
          <h1 className="cart-title" style={{ marginBottom: 0 }}>Shopping Bag ({cartItems.length})</h1>
          <button onClick={clearCart} className="btn btn-ghost btn-sm" style={{ color: 'var(--text-muted)' }}>
            Clear All
          </button>
        </div>

        <div className="cart-layout">
          {/* Items Column */}
          <div className="cart-items-wrapper">
            {cartItems.map(({ product, qty }) => (
              <div key={product._id} className="cart-item-card">
                <Link to={`/products/${product._id}`}>
                  <img src={product.image} alt={product.name} className="cart-item-img" />
                </Link>

                <div className="cart-item-info">
                  <span className="cart-item-category">{product.category}</span>
                  <Link to={`/products/${product._id}`}>
                    <h3 className="cart-item-name">{product.name}</h3>
                  </Link>
                  <span className="cart-item-price">₹{Number(product.price).toLocaleString('en-IN')} each</span>
                </div>

                <div className="cart-item-actions">
                  <div className="cart-item-total">₹{Number(product.price * qty).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <div className="cart-qty-ctrl">
                      <button
                        className="cart-qty-btn"
                        onClick={() => updateQty(product._id, qty - 1)}
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="cart-qty-count">{qty}</span>
                      <button
                        className="cart-qty-btn"
                        onClick={() => updateQty(product._id, qty + 1)}
                        disabled={qty >= (product.countInStock ?? 99)}
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <button
                      className="cart-remove-btn"
                      onClick={() => removeFromCart(product._id)}
                      title="Remove product"
                      aria-label="Remove item"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary Column */}
          <div className="cart-summary-card">
            <h2 className="summary-title">Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal</span>
              <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>₹{subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="summary-row">
              <span>Estimated Shipping</span>
              <span>{shipping === 0 ? <strong style={{ color: 'var(--status-success)' }}>Free</strong> : `₹${shipping.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}</span>
            </div>

            <div className="summary-row">
              <span>Estimated Tax (8%)</span>
              <span>₹{tax.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <div className="summary-total">
              <span>Total</span>
              <span>₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>

            <button
              onClick={() => navigate('/checkout')}
              className="btn btn-primary btn-lg checkout-btn"
            >
              Proceed to Checkout <ArrowRight size={18} />
            </button>

            <Link to="/products" className="continue-shopping-link">
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
