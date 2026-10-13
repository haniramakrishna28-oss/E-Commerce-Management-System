import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import './Footer.css';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <h3>AURA</h3>
            <p>
              Curated essentials designed for everyday performance, longevity, and quiet sophistication.
            </p>
          </div>

          <div className="footer-col">
            <h4>Explore</h4>
            <ul className="footer-links">
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/products?category=Audio">Audio</Link></li>
              <li><Link to="/products?category=Wearables">Wearables</Link></li>
              <li><Link to="/products?category=Desk Setup">Desk Setup</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Customer</h4>
            <ul className="footer-links">
              <li><Link to="/cart">Cart</Link></li>
              <li><Link to="/wishlist">Wishlist</Link></li>
              <li><Link to="/orders">Order History</Link></li>
              <li><Link to="/login">Account</Link></li>
            </ul>
          </div>

          <div className="footer-col footer-newsletter">
            <h4>Stay Connected</h4>
            <p>Subscribe for quiet releases, seasonal capsules, and design stories.</p>
            {subscribed ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.9rem' }}>
                <CheckCircle2 size={18} />
                <span>Thank you for subscribing.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="newsletter-form">
                <input
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="newsletter-input"
                />
                <button type="submit" className="btn btn-primary btn-sm" aria-label="Subscribe">
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} AURA Studio Inc. All rights reserved.</p>
          <p>Designed with modern minimalism & precision.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
