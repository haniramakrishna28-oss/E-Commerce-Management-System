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

  const setAuthSession = (userData) => {
    localStorage.setItem('aura_user', JSON.stringify(userData));
    localStorage.setItem('aura_token', userData.token);
    setUser(userData);
    setToken(userData.token);
  };

  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      if (!data?.token) {
        throw new Error('Invalid login response from server');
      }
      setAuthSession(data);
      return { success: true, user: data };
    } catch (err) {
      // Local fallback for offline demo credentials only
      if (email === 'admin@aura.store' && password === 'Admin123!') {
        const adminUser = {
          _id: 'user-admin',
          name: 'Alexander Admin',
          email: 'admin@aura.store',
          isAdmin: true,
          token: 'mock-jwt-admin-token',
        };
        setAuthSession(adminUser);
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
        setAuthSession(regularUser);
        return { success: true, user: regularUser };
      }
      throw err;
    }
  };

  const register = async (name, email, password) => {
    const data = await authAPI.register(name, email, password);
    if (!data?.token || !data?._id) {
      throw new Error('Invalid registration response from server');
    }
    setAuthSession(data);
    return { success: true, user: data };
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
