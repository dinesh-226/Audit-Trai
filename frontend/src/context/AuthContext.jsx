import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('auditflow_token') || null);
  const [loading, setLoading] = useState(true);

  // Initialize user from localStorage if present
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('auditflow_user');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {}
    return null;
  });

  // Verify active profile on load if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = localStorage.getItem('auditflow_token');
        const savedUserStr = localStorage.getItem('auditflow_user');

        if (savedToken && savedUserStr) {
          try {
            const parsedUser = JSON.parse(savedUserStr);
            setUser(parsedUser);
          } catch (e) {
            // fallback
          }
        }
      } catch (err) {
        console.warn('Could not restore auth profile:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.auth.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('auditflow_token', res.token);
    localStorage.setItem('auditflow_user', JSON.stringify(res.user));
    return res;
  };

  const register = async (userData) => {
    const res = await api.auth.register(userData);
    if (res.token && res.user && res.user.approvalStatus !== 'pending') {
      setToken(res.token);
      setUser(res.user);
      localStorage.setItem('auditflow_token', res.token);
      localStorage.setItem('auditflow_user', JSON.stringify(res.user));
    }
    return res;
  };

  const updateProfile = async (profileData) => {
    try {
      if (api.auth?.updateProfile) {
        const updated = await api.auth.updateProfile(profileData);
        setUser(updated);
        localStorage.setItem('auditflow_user', JSON.stringify(updated));
        return updated;
      }
    } catch (e) {
      console.warn('Backend updateProfile failed, updating local state:', e);
    }
    const updated = { ...(user || {}), ...profileData };
    setUser(updated);
    localStorage.setItem('auditflow_user', JSON.stringify(updated));
    return updated;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auditflow_token');
    localStorage.removeItem('auditflow_user');
    localStorage.removeItem('auditflow_demo_role');
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        updateProfile,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
