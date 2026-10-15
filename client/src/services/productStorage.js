import { mockProducts } from './mockData';

const STORAGE_KEY = 'aura_products';

export const getStoredProducts = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read products from localStorage:', e);
  }
  // Initialize with mockProducts
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mockProducts));
  } catch (e) {
    console.error('Failed to initialize products in localStorage:', e);
  }
  return [...mockProducts];
};

export const saveStoredProducts = (products) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    window.dispatchEvent(new CustomEvent('aura_products_updated', { detail: products }));
  } catch (e) {
    console.error('Failed to save products to localStorage:', e);
  }
};

export const getStoredProductById = (id) => {
  const products = getStoredProducts();
  return (
    products.find(
      (p) => (p._id || p.id) === id || String(p._id) === String(id) || String(p.id) === String(id)
    ) || null
  );
};

export const addStoredProduct = (productData) => {
  const products = getStoredProducts();
  const id = 'prod-' + Date.now();
  const newProduct = {
    _id: id,
    id: id,
    name: productData.name,
    category: productData.category || 'Audio',
    price: Number(productData.price) || 0,
    countInStock: Math.max(0, Number(productData.countInStock) || 0),
    description: productData.description || '',
    image: productData.image || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800',
    featured: Boolean(productData.featured),
    rating: 5.0,
    reviewsCount: 0,
    reviews: [],
    details: productData.details || [
      'Authentic certified hardware',
      'Official manufacturer warranty included',
      'Fast doorstep delivery across all metro locations',
    ],
    createdAt: new Date().toISOString(),
  };

  const updated = [newProduct, ...products];
  saveStoredProducts(updated);
  return newProduct;
};

export const updateStoredProduct = (id, fields) => {
  const products = getStoredProducts();
  const updated = products.map((p) => {
    if ((p._id || p.id) === id || String(p._id) === String(id) || String(p.id) === String(id)) {
      return {
        ...p,
        ...fields,
        price: fields.price !== undefined ? Number(fields.price) : p.price,
        countInStock:
          fields.countInStock !== undefined
            ? Math.max(0, Number(fields.countInStock))
            : p.countInStock,
      };
    }
    return p;
  });

  saveStoredProducts(updated);
  return updated;
};

export const deleteStoredProduct = (id) => {
  const products = getStoredProducts();
  const updated = products.filter(
    (p) => (p._id || p.id) !== id && String(p._id) !== String(id) && String(p.id) !== String(id)
  );
  saveStoredProducts(updated);
  return updated;
};
