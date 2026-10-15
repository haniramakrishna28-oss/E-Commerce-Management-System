import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Star, ShoppingBag, Heart, Check } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const [added, setAdded] = useState(false);

  const prodId = product._id || product.id;
  const isFavorited = isInWishlist(prodId);
  const isOutOfStock = product.countInStock <= 0;

  const handleAddToCart = (e) => {
    e.preventDefault();
    if (isOutOfStock) return;

    addToCart(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const handleWishlistToggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
  };

  return (
    <div className="product-card">
      <Link to={`/products/${prodId}`} className="product-card-image-wrapper">
        <img
          src={product.image}
          alt={product.name}
          className="product-card-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800';
          }}
        />
        <button
          className={`product-wishlist-btn ${isFavorited ? 'active' : ''}`}
          onClick={handleWishlistToggle}
          title={isFavorited ? 'Remove from wishlist' : 'Save to wishlist'}
          aria-label="Wishlist toggle"
        >
          <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
        </button>

        {product.featured && (
          <span className="badge badge-brand product-card-badge">Featured</span>
        )}
        {isOutOfStock && (
          <span className="badge badge-danger product-card-badge">Sold Out</span>
        )}
      </Link>

      <div className="product-card-body">
        <div className="product-card-category">{product.category}</div>
        <Link to={`/products/${prodId}`}>
          <h3 className="product-card-title">{product.name}</h3>
        </Link>

        <div className="product-card-rating">
          <div className="rating-stars">
            <Star size={15} fill="#f59e0b" stroke="#f59e0b" />
          </div>
          <span className="rating-val">{product.rating}</span>
          <span className="rating-count">({product.reviewsCount || 0})</span>
        </div>

        <div className="product-card-footer">
          <div className="product-card-price">₹{Number(product.price).toLocaleString('en-IN')}</div>
          <button
            className={`add-cart-btn ${added ? 'added' : ''}`}
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={`Add ${product.name} to cart`}
          >
            {added ? (
              <>
                <Check size={16} /> Added
              </>
            ) : isOutOfStock ? (
              'Sold Out'
            ) : (
              <>
                <ShoppingBag size={15} /> Add to Cart
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
