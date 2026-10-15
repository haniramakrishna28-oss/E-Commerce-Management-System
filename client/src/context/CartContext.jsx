import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

const GUEST_CART_KEY = 'aura_cart_guest';

const getCartKey = (user) => {
  if (!user || !user.email) return GUEST_CART_KEY;
  return `aura_cart_${user.email.toLowerCase().trim()}`;
};

const sanitizeCartItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.filter(
    item => item && item.product && (item.product._id || item.product.id) && Number(item.qty) > 0
  );
};

const loadCartFromStorage = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? sanitizeCartItems(JSON.parse(saved)) : [];
  } catch (e) {
    console.error(`Failed to load cart from ${key}:`, e);
    return [];
  }
};

const saveCartToStorage = (key, items) => {
  try {
    const valid = sanitizeCartItems(items);
    localStorage.setItem(key, JSON.stringify(valid));
  } catch (e) {
    console.error(`Failed to save cart to ${key}:`, e);
  }
};

// Merge source items into target items without duplicating products
const mergeCartItems = (targetItems, sourceItems) => {
  const merged = [...sanitizeCartItems(targetItems)];
  const validSource = sanitizeCartItems(sourceItems);

  for (const src of validSource) {
    const srcId = src.product._id || src.product.id;
    const existingIndex = merged.findIndex(
      item => (item.product._id || item.product.id) === srcId
    );
    const stockLimit = src.product.countInStock ?? 99;

    if (existingIndex > -1) {
      const combinedQty = Math.min(merged[existingIndex].qty + src.qty, stockLimit);
      merged[existingIndex] = { ...merged[existingIndex], qty: combinedQty };
    } else {
      const validQty = Math.min(src.qty, stockLimit);
      merged.push({ ...src, qty: validQty });
    }
  }

  return merged;
};

// Migrate old un-scoped 'aura_cart' once if it exists
const cleanupLegacyCart = (activeKey) => {
  try {
    const legacy = localStorage.getItem('aura_cart');
    if (!legacy) return;
    const legacyItems = JSON.parse(legacy);
    if (Array.isArray(legacyItems) && legacyItems.length > 0) {
      const current = loadCartFromStorage(activeKey);
      const merged = mergeCartItems(current, legacyItems);
      saveCartToStorage(activeKey, merged);
    }
    localStorage.removeItem('aura_cart');
  } catch (e) {
    console.error('Failed to cleanup legacy aura_cart', e);
  }
};

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const prevUserRef = useRef(user);
  const activeKey = getCartKey(user);

  const [cartItems, setCartItems] = useState(() => {
    cleanupLegacyCart(activeKey);
    return loadCartFromStorage(activeKey);
  });

  // Handle user authentication transitions (Login, Logout, Switch User)
  useEffect(() => {
    const prevUser = prevUserRef.current;
    const prevKey = getCartKey(prevUser);
    const currentKey = getCartKey(user);

    // If user state hasn't changed key, do nothing
    if (prevKey === currentKey) {
      return;
    }

    if (!prevUser && user) {
      // 1. Guest -> Logged In: Merge guest cart into user's account cart
      const guestItems = loadCartFromStorage(GUEST_CART_KEY);
      const userItems = loadCartFromStorage(currentKey);

      let finalItems;
      if (guestItems.length > 0) {
        finalItems = mergeCartItems(userItems, guestItems);
        saveCartToStorage(currentKey, finalItems);
        // Clear guest cart so it doesn't leak to subsequent guest sessions
        localStorage.removeItem(GUEST_CART_KEY);
      } else {
        finalItems = userItems;
      }

      setCartItems(finalItems);
    } else if (prevUser && !user) {
      // 2. Logged In -> Logout: Start with a clean, isolated guest cart
      localStorage.removeItem(GUEST_CART_KEY);
      setCartItems([]);
    } else {
      // 3. Account Switch (e.g., Customer -> Admin or User A -> User B)
      const switchedItems = loadCartFromStorage(currentKey);
      localStorage.removeItem(GUEST_CART_KEY);
      setCartItems(switchedItems);
    }

    prevUserRef.current = user;
  }, [user]);

  const addToCart = (product, qty = 1) => {
    if (!product) return;
    setCartItems(prev => {
      const prodId = product._id || product.id;
      const existingIndex = prev.findIndex(
        item => (item.product._id || item.product.id) === prodId
      );
      const stockLimit = product.countInStock ?? 99;
      let newItems;

      if (existingIndex > -1) {
        newItems = [...prev];
        const newQty = Math.min(newItems[existingIndex].qty + qty, stockLimit);
        newItems[existingIndex] = { ...newItems[existingIndex], qty: newQty };
      } else {
        const validQty = Math.min(qty, stockLimit);
        newItems = [...prev, { product, qty: validQty }];
      }

      const key = getCartKey(userRef.current);
      saveCartToStorage(key, newItems);
      return newItems;
    });
  };

  const updateQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev => {
      const newItems = prev.map(item => {
        const itemId = item.product._id || item.product.id;
        if (itemId === productId) {
          const maxStock = item.product.countInStock ?? 99;
          return { ...item, qty: Math.min(newQty, maxStock) };
        }
        return item;
      });

      const key = getCartKey(userRef.current);
      saveCartToStorage(key, newItems);
      return newItems;
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => {
      const newItems = prev.filter(
        item => (item.product._id || item.product.id) !== productId
      );
      const key = getCartKey(userRef.current);
      saveCartToStorage(key, newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    const key = getCartKey(userRef.current);
    saveCartToStorage(key, []);
    setCartItems([]);
  };

  const itemCount = cartItems.reduce((acc, item) => acc + (Number(item.qty) || 0), 0);
  const subtotal = cartItems.reduce(
    (acc, item) => acc + ((Number(item.product?.price) || 0) * (Number(item.qty) || 0)),
    0
  );
  const shipping = subtotal > 1500 || subtotal === 0 ? 0 : 149;
  const tax = Number((subtotal * 0.08).toFixed(2));
  const total = Number((subtotal + shipping + tax).toFixed(2));

  return (
    <CartContext.Provider
      value={{
        cartItems,
        itemCount,
        addToCart,
        updateQty,
        removeFromCart,
        clearCart,
        subtotal,
        shipping,
        tax,
        total,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
