const API_BASE_URL = import.meta.env.PROD
  ? 'https://e-commerce-management-system-awev.onrender.com/api'
  : '/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('aura_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async (response) => {
  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json')
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const errorMsg =
      response.status === 429
        ? 'Too many requests right now. Please wait a few seconds and try again.'
        : data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  if (!data) {
    throw new Error('Unexpected non-JSON response from server');
  }

  return data;
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const apiFetch = async (path, options = {}, retriesLeft = 2) => {
  const res = await fetch(`${API_BASE_URL}${path}`, options);
  if (res.status === 429 && retriesLeft > 0) {
    const retryAfterSec = Number(res.headers.get('retry-after'));
    const waitMs =
      Number.isFinite(retryAfterSec) && retryAfterSec > 0
        ? Math.min(retryAfterSec * 1000, 5000)
        : (3 - retriesLeft) * 1500;
    await delay(waitMs);
    return apiFetch(path, options, retriesLeft - 1);
  }
  return handleResponse(res);
};

export const authAPI = {
  login: async (email, password) => {
    return apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (name, email, password) => {
    return apiFetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
  },

  getProfile: async () => {
    return apiFetch('/auth/profile', {
      headers: getAuthHeaders(),
    });
  },

  toggleWishlist: async (productId) => {
    return apiFetch(`/auth/wishlist/${productId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
  },
};

export const productsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiFetch(`/products${queryString ? `?${queryString}` : ''}`);
  },

  getById: async (id) => {
    return apiFetch(`/products/${id}`);
  },

  create: async (productData) => {
    return apiFetch('/products', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
  },

  update: async (id, productData) => {
    return apiFetch(`/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
  },

  delete: async (id) => {
    return apiFetch(`/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  addReview: async (id, reviewData) => {
    return apiFetch(`/products/${id}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData),
    });
  },
};

export const cartAPI = {
  getCart: async () => {
    return apiFetch('/cart', {
      headers: getAuthHeaders(),
    });
  },

  addToCart: async (productId, qty = 1) => {
    return apiFetch('/cart', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, qty }),
    });
  },

  updateQty: async (productId, qty) => {
    return apiFetch(`/cart/${productId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ qty }),
    });
  },

  removeItem: async (productId) => {
    return apiFetch(`/cart/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },

  clearCart: async () => {
    return apiFetch('/cart', {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
  },
};

export const ordersAPI = {
  create: async (orderData) => {
    return apiFetch('/orders', {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    });
  },

  getMyOrders: async () => {
    return apiFetch('/orders/myorders', {
      headers: getAuthHeaders(),
    });
  },

  getById: async (id) => {
    return apiFetch(`/orders/${id}`, {
      headers: getAuthHeaders(),
    });
  },

  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiFetch(`/orders${queryString ? `?${queryString}` : ''}`, {
      headers: getAuthHeaders(),
    });
  },

  updateStatus: async (id, status) => {
    return apiFetch(`/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
  },
};

export const analyticsAPI = {
  getDashboard: async () => {
    return apiFetch('/admin/dashboard', {
      headers: getAuthHeaders(),
    });
  },
};
