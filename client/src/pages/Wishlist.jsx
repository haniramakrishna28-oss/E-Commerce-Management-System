import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';

const Wishlist = () => {
  const { wishlist } = useWishlist();

  if (wishlist.length === 0) {
    return (
      <div className="container page-wrapper">
        <div className="state-container">
          <Heart className="state-icon" />
          <h2 className="state-title">Your wishlist is empty</h2>
          <p className="state-desc">Save items you love by tapping the heart icon on any product.</p>
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
        <h1 className="page-title">Saved Items ({wishlist.length})</h1>
        <p className="page-subtitle">Your personal curated wishlist of minimalist objects.</p>
      </div>

      <div className="products-grid">
        {wishlist.map(product => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
