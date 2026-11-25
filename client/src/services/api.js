const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')
).replace(/\/+$/, '');

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
    const errorMsg = data?.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }

  if (!data) {
    throw new Error('Unexpected non-JSON response from server');
  }

  return data;
};

export const authAPI = {
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  register: async (name, email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse(res);
  },

  getProfile: async () => {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  toggleWishlist: async (productId) => {
    const res = await fetch(`${API_BASE_URL}/auth/wishlist/${productId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

export const productsAPI = {
  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/products${queryString ? `?${queryString}` : ''}`);
    return handleResponse(res);
  },

  getById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/products/${id}`);
    return handleResponse(res);
  },

  create: async (productData) => {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse(res);
  },

  update: async (id, productData) => {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse(res);
  },

  delete: async (id) => {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  addReview: async (id, reviewData) => {
    const res = await fetch(`${API_BASE_URL}/products/${id}/reviews`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(reviewData),
    });
    return handleResponse(res);
  },
};

export const cartAPI = {
  getCart: async () => {
    const res = await fetch(`${API_BASE_URL}/cart`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  addToCart: async (productId, qty = 1) => {
    const res = await fetch(`${API_BASE_URL}/cart`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ productId, qty }),
    });
    return handleResponse(res);
  },

  updateQty: async (productId, qty) => {
    const res = await fetch(`${API_BASE_URL}/cart/${productId}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ qty }),
    });
    return handleResponse(res);
  },

  removeItem: async (productId) => {
    const res = await fetch(`${API_BASE_URL}/cart/${productId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  clearCart: async () => {
    const res = await fetch(`${API_BASE_URL}/cart`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};

export const ordersAPI = {
  create: async (orderData) => {
    const res = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(orderData),
    });
    return handleResponse(res);
  },

  getMyOrders: async () => {
    const res = await fetch(`${API_BASE_URL}/orders/myorders`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getById: async (id) => {
    const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  getAll: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const res = await fetch(`${API_BASE_URL}/orders${queryString ? `?${queryString}` : ''}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },

  updateStatus: async (id, status) => {
    const res = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status }),
    });
    return handleResponse(res);
  },
};

export const analyticsAPI = {
  getDashboard: async () => {
    const res = await fetch(`${API_BASE_URL}/admin/dashboard`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res);
  },
};
