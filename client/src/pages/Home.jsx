import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Truck, RotateCcw, Sparkles } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { mockProducts } from '../services/mockData';
import './Home.css';

const Home = () => {
  const featuredProducts = mockProducts.filter(p => p.featured);

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <div className="hero-pill">
                <Sparkles size={14} /> New Season Capsule 2026
              </div>
              <h1 className="hero-title">
                Essentials for the <span>modern</span> aesthetic.
              </h1>
              <p className="hero-description">
                Experience refined hardware, ergonomic desk additions, and luxury audio designed with purposeful restraint.
              </p>
              <div className="hero-buttons">
                <Link to="/products" className="btn btn-primary btn-lg">
                  Shop All Products <ArrowRight size={18} />
                </Link>
                <Link to="/products?category=Audio" className="btn btn-outline btn-lg">
                  Explore Audio
                </Link>
              </div>
            </div>

            <div className="hero-image-wrapper">
              <img
                src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1000&q=80"
                alt="AURA Wireless Premium Audio"
                className="hero-image"
                fetchPriority="high"
              />
              <div className="hero-float-card">
                <div className="hero-float-icon">
                  <Sparkles size={18} />
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>Featured Highlight</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Acoustic One Wireless</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="features-strip">
        <div className="container">
          <div className="features-grid">
            <div className="feature-item">
              <div className="feature-icon-box">
                <Truck size={22} />
              </div>
              <div>
                <h4>Express Complimentary Shipping</h4>
                <p>Free tracked dispatch on all orders over ₹1,500.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box">
                <Shield size={22} />
              </div>
              <div>
                <h4>Two-Year Comprehensive Warranty</h4>
                <p>Engineered for longevity, guaranteed with zero hassle.</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon-box">
                <RotateCcw size={22} />
              </div>
              <div>
                <h4>30-Day Effortless Returns</h4>
                <p>Return or exchange any piece in original condition.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Section */}
      <section className="container" style={{ marginBottom: 'var(--space-16)' }}>
        <div className="section-header">
          <div>
            <div className="section-tag">Curated Collection</div>
            <h2 className="section-title">Featured Products</h2>
          </div>
          <Link to="/products" className="btn btn-outline btn-sm">
            View All ({mockProducts.length}) <ArrowRight size={14} />
          </Link>
        </div>

        <div className="products-grid">
          {featuredProducts.map(product => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>

        {/* Promotional Banner */}
        <div className="promo-banner">
          <div>
            <h3>Built for focus. Engineered for comfort.</h3>
            <p>
              Discover our minimalist desk accessories and precision peripherals crafted from aerospace aluminum and sustainably sourced materials.
            </p>
          </div>
          <Link to="/products?category=Desk Setup" className="btn btn-brand btn-lg" style={{ whiteSpace: 'nowrap' }}>
            Discover Desk Setup
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
