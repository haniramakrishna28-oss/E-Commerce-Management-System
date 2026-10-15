import mongoose from 'mongoose';
import Product from '../models/Product.js';
import { memoryStore } from '../config/store.js';
import { getIsMongooseConnected } from '../config/db.js';

// @desc    Fetch all products with search, category filter, price filter, sorting & pagination
// @route   GET /api/products
// @access  Public
export const getProducts = async (req, res) => {
  try {
    const { category, search, minPrice, maxPrice, sort, page = 1, limit = 12 } = req.query;

    if (getIsMongooseConnected()) {
      const query = {};

      if (category && category !== 'all') {
        query.category = { $regex: new RegExp(`^${category}$`, 'i') };
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = Number(minPrice);
        if (maxPrice) query.price.$lte = Number(maxPrice);
      }

      let sortOptions = { createdAt: -1 };
      if (sort === 'price-low') sortOptions = { price: 1 };
      if (sort === 'price-high') sortOptions = { price: -1 };
      if (sort === 'rating') sortOptions = { rating: -1 };

      const total = await Product.countDocuments(query);
      const products = await Product.find(query)
        .sort(sortOptions)
        .skip((Number(page) - 1) * Number(limit))
        .limit(Number(limit));

      return res.json({
        products,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        total,
      });
    } else {
      // Memory Store fallback
      let filtered = [...memoryStore.products];

      if (category && category !== 'all') {
        filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
      }

      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
        );
      }

      if (minPrice) {
        filtered = filtered.filter(p => p.price >= Number(minPrice));
      }
      if (maxPrice) {
        filtered = filtered.filter(p => p.price <= Number(maxPrice));
      }

      if (sort === 'price-low') filtered.sort((a, b) => a.price - b.price);
      else if (sort === 'price-high') filtered.sort((a, b) => b.price - a.price);
      else if (sort === 'rating') filtered.sort((a, b) => b.rating - a.rating);
      else filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

      const total = filtered.length;
      const start = (Number(page) - 1) * Number(limit);
      const paginated = filtered.slice(start, start + Number(limit));

      return res.json({
        products: paginated,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)) || 1,
        total,
      });
    }
  } catch (error) {
    console.error('getProducts error:', error);
    res.status(500).json({ message: 'Server error retrieving products', error: error.message });
  }
};

// @desc    Fetch single product by ID
// @desc    Fetch single product by ID
// @route   GET /api/products/:id
// @access  Public
export const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    if (getIsMongooseConnected()) {
      let product = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id);
      }
      if (!product) {
        product = await Product.findOne({ $or: [{ _id: id }, { id: id }] }).catch(() => null);
      }
      if (product) {
        return res.json(product);
      }
    }

    const product = memoryStore.products.find(p => p._id === id || p.id === id);
    if (product) {
      return res.json(product);
    }

    return res.status(404).json({ message: 'Product not found' });
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving product', error: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
export const createProduct = async (req, res) => {
  try {
    const { name, price, description = '', image, category, countInStock, featured, details } = req.body;

    if (!name || price === undefined || price === null || !category) {
      return res.status(400).json({ message: 'Please provide name, price, and category' });
    }

    const userId = req.user?._id || '65f1a0010000000000000001';

    if (getIsMongooseConnected()) {
      const product = new Product({
        name,
        price: Number(price),
        user: userId,
        image: image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        category,
        countInStock: Number(countInStock) || 0,
        featured: !!featured,
        description: description || '',
        details: Array.isArray(details) ? details : [],
      });

      const createdProduct = await product.save();
      return res.status(201).json(createdProduct);
    } else {
      const newProduct = {
        _id: 'prod-' + Date.now(),
        id: 'prod-' + Date.now(),
        name,
        price: Number(price),
        user: userId,
        image: image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
        category,
        countInStock: Number(countInStock) || 0,
        featured: !!featured,
        description: description || '',
        rating: 5.0,
        reviewsCount: 0,
        details: Array.isArray(details) ? details : [],
        reviews: [],
        createdAt: new Date().toISOString(),
      };

      memoryStore.products.unshift(newProduct);
      return res.status(201).json(newProduct);
    }
  } catch (error) {
    res.status(500).json({ message: 'Error creating product', error: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, description, image, category, countInStock, featured } = req.body;

    if (getIsMongooseConnected()) {
      let product = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id);
      }
      if (!product) {
        product = await Product.findOne({ $or: [{ _id: id }, { id: id }] }).catch(() => null);
      }

      if (product) {
        product.name = name ?? product.name;
        product.price = price !== undefined ? Number(price) : product.price;
        product.description = description ?? product.description;
        product.image = image ?? product.image;
        product.category = category ?? product.category;
        product.countInStock = countInStock !== undefined ? Number(countInStock) : product.countInStock;
        product.featured = featured !== undefined ? featured : product.featured;

        const updatedProduct = await product.save();
        return res.json(updatedProduct);
      }
    }

    const idx = memoryStore.products.findIndex(p => p._id === id || p.id === id);
    if (idx !== -1) {
      const p = memoryStore.products[idx];
      memoryStore.products[idx] = {
        ...p,
        name: name ?? p.name,
        price: price !== undefined ? Number(price) : p.price,
        description: description ?? p.description,
        image: image ?? p.image,
        category: category ?? p.category,
        countInStock: countInStock !== undefined ? Number(countInStock) : p.countInStock,
        featured: featured !== undefined ? featured : p.featured,
      };

      return res.json(memoryStore.products[idx]);
    }

    return res.status(404).json({ message: 'Product not found' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating product', error: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    if (getIsMongooseConnected()) {
      let product = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        product = await Product.findById(id);
      }
      if (!product) {
        product = await Product.findOne({ $or: [{ _id: id }, { id: id }] }).catch(() => null);
      }

      if (product) {
        await product.deleteOne();
        return res.json({ message: 'Product deleted successfully' });
      }
    }

    const idx = memoryStore.products.findIndex(p => p._id === id || p.id === id);
    if (idx !== -1) {
      memoryStore.products.splice(idx, 1);
      return res.json({ message: 'Product deleted successfully' });
    }

    return res.status(404).json({ message: 'Product not found' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting product', error: error.message });
  }
};

// @desc    Create new review for product
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Please provide rating and review comment' });
    }

    if (getIsMongooseConnected()) {
      const product = await Product.findById(id);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      const review = {
        userName: req.user.name,
        rating: Number(rating),
        comment: comment.trim(),
        user: req.user._id,
      };

      product.reviews.push(review);
      product.reviewsCount = product.reviews.length;
      product.rating =
        Number((product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length).toFixed(1));

      await product.save();
      return res.status(201).json({ message: 'Review added successfully', reviews: product.reviews });
    } else {
      const product = memoryStore.products.find(p => p._id === id || p.id === id);
      if (!product) return res.status(404).json({ message: 'Product not found' });

      const newReview = {
        _id: 'rev-' + Date.now(),
        userName: req.user.name,
        rating: Number(rating),
        comment: comment.trim(),
        createdAt: new Date().toISOString().split('T')[0],
      };

      if (!product.reviews) product.reviews = [];
      product.reviews.push(newReview);
      product.reviewsCount = product.reviews.length;
      product.rating =
        Number((product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length).toFixed(1));

      return res.status(201).json({ message: 'Review added successfully', reviews: product.reviews });
    }
  } catch (error) {
    res.status(500).json({ message: 'Error adding review', error: error.message });
  }
};
