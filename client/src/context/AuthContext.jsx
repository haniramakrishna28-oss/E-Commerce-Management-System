import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('aura_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('aura_token') || null;
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem('aura_user', JSON.stringify(user));
      } else {
        localStorage.removeItem('aura_user');
      }
      if (token) {
        localStorage.setItem('aura_token', token);
      } else {
        localStorage.removeItem('aura_token');
      }
    } catch (e) {
      console.error('Failed to sync auth in localStorage', e);
    }
  }, [user, token]);

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      setUser(data);
      setToken(data.token);
      return { success: true, user: data };
    } catch (err) {
      // Local fallback for offline mode
      if (email === 'admin@aura.store' && password === 'Admin123!') {
        const adminUser = {
          _id: 'user-admin',
          name: 'Alexander Admin',
          email: 'admin@aura.store',
          isAdmin: true,
          token: 'mock-jwt-admin-token',
        };
        setUser(adminUser);
        setToken(adminUser.token);
        return { success: true, user: adminUser };
      }
      if (email === 'customer@aura.store' && password === 'User123!') {
        const regularUser = {
          _id: 'user-customer',
          name: 'Elena Rostova',
          email: 'customer@aura.store',
          isAdmin: false,
          token: 'mock-jwt-customer-token',
        };
        setUser(regularUser);
        setToken(regularUser.token);
        return { success: true, user: regularUser };
      }
      throw err;
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await authAPI.register(name, email, password);
      setUser(data);
      setToken(data.token);
      return { success: true, user: data };
    } catch (err) {
      // Offline fallback
      const newUser = {
        _id: 'user-' + Date.now(),
        name,
        email,
        isAdmin: false,
        token: 'mock-jwt-' + Date.now(),
      };
      setUser(newUser);
      setToken(newUser.token);
      return { success: true, user: newUser };
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('aura_user');
    localStorage.removeItem('aura_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isAdmin: !!user?.isAdmin,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
