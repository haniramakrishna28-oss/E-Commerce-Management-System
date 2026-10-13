import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, ArrowLeft, ArrowRight, PackageSearch } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { mockProducts, mockCategories } from '../services/mockData';
import { productsAPI } from '../services/api';
import './Products.css';

const ITEMS_PER_PAGE = 6;

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlCategory = searchParams.get('category') || 'all';
  const urlSearch = searchParams.get('search') || '';

  const [productsList, setProductsList] = useState(mockProducts);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('featured');
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);

  // Fetch products from backend API on mount
  useEffect(() => {
    const fetchApiProducts = async () => {
      try {
        setLoading(true);
        const data = await productsAPI.getAll();
        if (data && data.products && data.products.length > 0) {
          setProductsList(data.products);
        }
      } catch (err) {
        console.warn('Backend not responding, displaying fallback catalog:', err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchApiProducts();
  }, []);

  // Sync state if URL search parameters change
  useEffect(() => {
    setSelectedCategory(searchParams.get('category') || 'all');
    setSearchQuery(searchParams.get('search') || '');
    setCurrentPage(1);
  }, [searchParams]);

  // Filter and Sort Products
  const filteredProducts = useMemo(() => {
    return productsList
      .filter(item => {
        // Category filter
        if (selectedCategory !== 'all' && item.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }

        // Search query filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = item.name.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchCat) return false;
        }

        // Price range filter
        if (priceRange === 'under-5000' && item.price >= 5000) return false;
        if (priceRange === '5000-20000' && (item.price < 5000 || item.price > 20000)) return false;
        if (priceRange === 'over-20000' && item.price <= 20000) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-low') return a.price - b.price;
        if (sortBy === 'price-high') return b.price - a.price;
        if (sortBy === 'rating') return b.rating - a.rating;
        // Default: featured first, then name
        return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
      });
  }, [productsList, selectedCategory, searchQuery, priceRange, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleCategoryChange = (catId) => {
    setSelectedCategory(catId);
    setCurrentPage(1);
    const newParams = new URLSearchParams(searchParams);
    if (catId === 'all') {
      newParams.delete('category');
    } else {
      newParams.set('category', catId);
    }
    setSearchParams(newParams);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    const newParams = new URLSearchParams(searchParams);
    newParams.delete('search');
    setSearchParams(newParams);
  };

  const handleResetFilters = () => {
    setSelectedCategory('all');
    setSearchQuery('');
    setPriceRange('all');
    setSortBy('featured');
    setCurrentPage(1);
    setSearchParams({});
  };

  return (
    <div className="products-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <h1 className="page-title">Curated Catalog</h1>
          <p className="page-subtitle">
            Minimalist hardware and audio objects engineered for modern performance.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="category-tabs">
          {mockCategories.map(cat => (
            <button
              key={cat.id}
              className={`category-pill ${selectedCategory.toLowerCase() === cat.id.toLowerCase() ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Filter and Sort Toolbar */}
        <div className="controls-bar">
          <div className="controls-left">
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
            </span>

            {searchQuery && (
              <div className="active-search-chip">
                <span>"{searchQuery}"</span>
                <button onClick={handleClearSearch} aria-label="Clear search">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="controls-right">
            {/* Price Filter */}
            <div className="filter-input-group">
              <label htmlFor="priceFilter">Price:</label>
              <select
                id="priceFilter"
                value={priceRange}
                onChange={(e) => {
                  setPriceRange(e.target.value);
                  setCurrentPage(1);
                }}
                className="filter-select"
              >
                <option value="all">All Prices</option>
                <option value="under-5000">Under ₹5,000</option>
                <option value="5000-20000">₹5,000 — ₹20,000</option>
                <option value="over-20000">Over ₹20,000</option>
              </select>
            </div>

            {/* Sort Select */}
            <div className="filter-input-group">
              <label htmlFor="sortBy">Sort:</label>
              <select
                id="sortBy"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="featured">Featured First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Loading Spinner or Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
            <div className="loading-spinner"></div>
            <p style={{ marginTop: 'var(--space-4)', color: 'var(--text-secondary)' }}>Loading catalog...</p>
          </div>
        ) : paginatedProducts.length > 0 ? (
          <div className="products-grid">
            {paginatedProducts.map(product => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        ) : (
          <div className="state-container">
            <PackageSearch className="state-icon" />
            <h3 className="state-title">No products found</h3>
            <p className="state-desc">
              We couldn't find any products matching your current filters. Try resetting the filters or searching for something else.
            </p>
            <button onClick={handleResetFilters} className="btn btn-outline">
              Reset All Filters
            </button>
          </div>
        )}

        {/* Basic Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <button
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <ArrowLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`page-btn ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="page-btn"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
