import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Star, Minus, Plus, ShoppingBag, Heart, ArrowLeft, Check, CheckCircle2, ShieldCheck, Truck, RotateCcw } from 'lucide-react';
import { mockProducts } from '../services/mockData';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [newReviewText, setNewReviewText] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    const found = mockProducts.find(p => p._id === id);
    if (found) {
      setProduct(found);
      setReviews(found.reviews || []);
    }
    setQuantity(1);
    window.scrollTo(0, 0);
  }, [id]);

  if (!product) {
    return (
      <div className="container page-wrapper">
        <div className="state-container">
          <h2 className="state-title">Product not found</h2>
          <p className="state-desc">The item you are looking for may have been removed or does not exist.</p>
          <Link to="/products" className="btn btn-primary">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const isFavorited = isInWishlist(product._id);
  const isOutOfStock = product.countInStock <= 0;

  const handleQuantityChange = (delta) => {
    setQuantity(prev => {
      const next = prev + delta;
      if (next < 1) return 1;
      if (next > product.countInStock) return product.countInStock;
      return next;
    });
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!newReviewText.trim()) return;

    const newRev = {
      id: 'rev-' + Date.now(),
      userName: 'Verified Buyer',
      rating: Number(newReviewRating),
      comment: newReviewText.trim(),
      date: new Date().toISOString().split('T')[0],
    };

    setReviews([newRev, ...reviews]);
    setNewReviewText('');
  };

  return (
    <div className="product-details-page">
      <div className="container page-wrapper">
        {/* Breadcrumb Navigation */}
        <div className="breadcrumbs">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/products">Products</Link>
          <span>/</span>
          <Link to={`/products?category=${encodeURIComponent(product.category)}`}>{product.category}</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        {/* Main Details Grid */}
        <div className="details-grid">
          {/* Gallery / Image Showcase */}
          <div className="details-image-card">
            <img
              src={product.image}
              alt={product.name}
              className="details-image"
              fetchPriority="high"
            />
          </div>

          {/* Product Info & Actions */}
          <div className="details-info">
            <span className="details-category">{product.category}</span>
            <h1 className="details-title">{product.name}</h1>

            <div className="details-rating-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#f59e0b' }}>
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i < Math.floor(product.rating) ? '#f59e0b' : 'none'}
                    stroke="#f59e0b"
                  />
                ))}
              </div>
              <span style={{ fontWeight: 600 }}>{product.rating}</span>
              <span style={{ color: 'var(--text-muted)' }}>({reviews.length} customer reviews)</span>
            </div>

            <div className="details-price-row">
              <span className="details-price">₹{Number(product.price).toLocaleString('en-IN')}</span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tax included. Free shipping eligible.</span>
            </div>

            <p className="details-description">{product.description}</p>

            {/* Available Stock Indicator */}
            <div className={`stock-status ${isOutOfStock ? 'stock-out' : 'stock-in'}`}>
              <span className="stock-dot"></span>
              <span>
                {isOutOfStock
                  ? 'Currently Out of Stock'
                  : `In Stock — ${product.countInStock} units ready to dispatch`}
              </span>
            </div>

            {/* Quantity Selector and Cart Action */}
            <div className="purchase-controls">
              <div className="qty-selector">
                <button
                  className="qty-btn"
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1 || isOutOfStock}
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="qty-value">{quantity}</span>
                <button
                  className="qty-btn"
                  onClick={() => handleQuantityChange(1)}
                  disabled={quantity >= product.countInStock || isOutOfStock}
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                className={`btn btn-primary btn-add-main ${added ? 'btn-brand' : ''}`}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
              >
                {added ? (
                  <>
                    <Check size={18} /> Added to Cart ({quantity})
                  </>
                ) : isOutOfStock ? (
                  'Out of Stock'
                ) : (
                  <>
                    <ShoppingBag size={18} /> Add to Cart
                  </>
                )}
              </button>

              <button
                className={`btn-wishlist-main ${isFavorited ? 'active' : ''}`}
                onClick={() => toggleWishlist(product)}
                title={isFavorited ? 'Remove from Wishlist' : 'Add to Wishlist'}
                aria-label="Toggle Wishlist"
              >
                <Heart size={20} fill={isFavorited ? 'currentColor' : 'none'} />
              </button>
            </div>

            {/* Highlights & Guarantees */}
            {product.details && (
              <div className="details-features">
                <h4>Engineered Specifications</h4>
                <ul>
                  {product.details.map((detail, idx) => (
                    <li key={idx}>
                      <CheckCircle2 size={16} color="var(--accent-brand)" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Customer Reviews Section */}
        <section className="reviews-section">
          <div className="reviews-header">
            <div>
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700 }}>
                Customer Feedback ({reviews.length})
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Verified purchases and detailed impressions.
              </p>
            </div>
          </div>

          {/* Add Review Form */}
          <div className="card" style={{ padding: 'var(--space-6)', marginBottom: 'var(--space-8)' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: 'var(--space-3)' }}>
              Write a Review
            </h3>
            <form onSubmit={handleAddReview}>
              <div style={{ display: 'flex', gap: 'var(--space-4)', marginBottom: 'var(--space-3)', alignItems: 'center' }}>
                <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Rating:</label>
                <select
                  value={newReviewRating}
                  onChange={(e) => setNewReviewRating(e.target.value)}
                  style={{ width: '120px', padding: '6px 12px' }}
                >
                  <option value="5">5 - Excellent</option>
                  <option value="4">4 - Very Good</option>
                  <option value="3">3 - Average</option>
                  <option value="2">2 - Fair</option>
                  <option value="1">1 - Poor</option>
                </select>
              </div>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <textarea
                  rows="3"
                  placeholder="Share your experience with this product..."
                  value={newReviewText}
                  onChange={(e) => setNewReviewText(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary btn-sm">
                Submit Review
              </button>
            </form>
          </div>

          {/* Reviews List */}
          <div className="reviews-list">
            {reviews.length > 0 ? (
              reviews.map(rev => (
                <div key={rev.id} className="review-item">
                  <div className="review-meta">
                    <span className="review-author">{rev.userName}</span>
                    <span className="review-date">{rev.date}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '2px', color: '#f59e0b', marginBottom: 'var(--space-2)' }}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        fill={i < rev.rating ? '#f59e0b' : 'none'}
                        stroke="#f59e0b"
                      />
                    ))}
                  </div>
                  <p className="review-text">{rev.comment}</p>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
                No reviews yet. Be the first to review this product!
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ProductDetails;
