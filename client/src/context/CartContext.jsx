import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aura_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed to save cart to localStorage', e);
    }
  }, [cartItems]);

  const addToCart = (product, qty = 1) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.product._id === product._id);
      const stockLimit = product.countInStock ?? 99;

      if (existingIndex > -1) {
        const newItems = [...prev];
        const newQty = Math.min(newItems[existingIndex].qty + qty, stockLimit);
        newItems[existingIndex] = { ...newItems[existingIndex], qty: newQty };
        return newItems;
      } else {
        const validQty = Math.min(qty, stockLimit);
        return [...prev, { product, qty: validQty }];
      }
    });
  };

  const updateQty = (productId, newQty) => {
    if (newQty <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => {
        if (item.product._id === productId) {
          const maxStock = item.product.countInStock ?? 99;
          return { ...item, qty: Math.min(newQty, maxStock) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.product._id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const itemCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const subtotal = cartItems.reduce((acc, item) => acc + (item.product.price * item.qty), 0);
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
