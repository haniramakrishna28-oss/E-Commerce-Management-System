import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { authAPI } from '../services/api';

const WishlistContext = createContext();

const GUEST_WISHLIST_KEY = 'aura_wishlist_guest';

const getWishlistKey = (user) => {
  if (!user || !user.email) return GUEST_WISHLIST_KEY;
  return `aura_wishlist_${user.email.toLowerCase().trim()}`;
};

const sanitizeWishlistItems = (items) => {
  if (!Array.isArray(items)) return [];
  return items.filter(item => item && (item._id || item.id));
};

const loadWishlistFromStorage = (key) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? sanitizeWishlistItems(JSON.parse(saved)) : [];
  } catch (e) {
    console.error(`Failed to load wishlist from ${key}:`, e);
    return [];
  }
};

const saveWishlistToStorage = (key, items) => {
  try {
    const valid = sanitizeWishlistItems(items);
    localStorage.setItem(key, JSON.stringify(valid));
  } catch (e) {
    console.error(`Failed to save wishlist to ${key}:`, e);
  }
};

const mergeWishlistItems = (targetItems, sourceItems) => {
  const merged = [...sanitizeWishlistItems(targetItems)];
  const validSource = sanitizeWishlistItems(sourceItems);

  for (const src of validSource) {
    const srcId = src._id || src.id;
    const exists = merged.some(item => (item._id || item.id) === srcId);
    if (!exists) {
      merged.push(src);
    }
  }

  return merged;
};

// Migrate old un-scoped 'aura_wishlist' once if it exists
const cleanupLegacyWishlist = (activeKey) => {
  try {
    const legacy = localStorage.getItem('aura_wishlist');
    if (!legacy) return;
    const legacyItems = JSON.parse(legacy);
    if (Array.isArray(legacyItems) && legacyItems.length > 0) {
      const current = loadWishlistFromStorage(activeKey);
      const merged = mergeWishlistItems(current, legacyItems);
      saveWishlistToStorage(activeKey, merged);
    }
    localStorage.removeItem('aura_wishlist');
  } catch (e) {
    console.error('Failed to cleanup legacy aura_wishlist', e);
  }
};

export const WishlistProvider = ({ children }) => {
  const { user, token } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const prevUserRef = useRef(user);
  const activeKey = getWishlistKey(user);

  const [wishlist, setWishlist] = useState(() => {
    cleanupLegacyWishlist(activeKey);
    return loadWishlistFromStorage(activeKey);
  });

  // Handle user authentication transitions (Login, Logout, Switch User)
  useEffect(() => {
    const prevUser = prevUserRef.current;
    const prevKey = getWishlistKey(prevUser);
    const currentKey = getWishlistKey(user);

    if (prevKey === currentKey) {
      return;
    }

    if (!prevUser && user) {
      // 1. Guest -> Logged In: Merge guest wishlist into user's account wishlist
      const guestItems = loadWishlistFromStorage(GUEST_WISHLIST_KEY);
      const userItems = loadWishlistFromStorage(currentKey);

      let finalItems;
      if (guestItems.length > 0) {
        finalItems = mergeWishlistItems(userItems, guestItems);
        saveWishlistToStorage(currentKey, finalItems);
        localStorage.removeItem(GUEST_WISHLIST_KEY);
      } else {
        finalItems = userItems;
      }

      // If user object already has wishlist from server profile, merge that too
      if (Array.isArray(user.wishlist) && user.wishlist.length > 0) {
        finalItems = mergeWishlistItems(finalItems, user.wishlist);
        saveWishlistToStorage(currentKey, finalItems);
      }

      setWishlist(finalItems);
    } else if (prevUser && !user) {
      // 2. Logged In -> Logout: Start with a clean, isolated guest wishlist
      localStorage.removeItem(GUEST_WISHLIST_KEY);
      setWishlist([]);
    } else {
      // 3. Account Switch (e.g. Customer -> Admin)
      const switchedItems = loadWishlistFromStorage(currentKey);
      localStorage.removeItem(GUEST_WISHLIST_KEY);
      setWishlist(switchedItems);
    }

    prevUserRef.current = user;
  }, [user]);

  const toggleWishlist = (product) => {
    if (!product) return;
    const prodId = product._id || product.id;

    setWishlist(prev => {
      const exists = prev.some(item => (item._id || item.id) === prodId);
      const next = exists
        ? prev.filter(item => (item._id || item.id) !== prodId)
        : [...prev, product];

      const key = getWishlistKey(userRef.current);
      saveWishlistToStorage(key, next);
      return next;
    });

    if (token && prodId) {
      authAPI.toggleWishlist(prodId).catch(err => {
        console.warn('Wishlist API sync error:', err.message);
      });
    }
  };

  const isInWishlist = (productId) => {
    if (!productId) return false;
    return wishlist.some(item => (item._id || item.id) === productId);
  };

  const clearWishlist = () => {
    const key = getWishlistKey(userRef.current);
    saveWishlistToStorage(key, []);
    setWishlist([]);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        isInWishlist,
        clearWishlist,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
