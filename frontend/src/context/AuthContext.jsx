import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

const getStoredItem = (key) => {
  try {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(key) || localStorage.getItem(key) || null;
  } catch (e) {
    return null;
  }
};

const setStoredItem = (key, value) => {
  try {
    if (typeof window === 'undefined') return;
    if (value !== null && value !== undefined) {
      sessionStorage.setItem(key, value);
      localStorage.setItem(key, value);
    } else {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    }
  } catch (e) {}
};

const clearStoredAuth = () => {
  try {
    if (typeof window === 'undefined') return;
    const keys = [
      'auditflow_token',
      'auditflow_user',
      'auditflow_demo_role',
      'auditflow_view_mode',
      'auditflow_active_tab',
      'auditflow_selected_ship_id',
      'auditflow_selected_container_id',
      'auditflow_timeline_container_id'
    ];
    keys.forEach(k => {
      sessionStorage.removeItem(k);
      localStorage.removeItem(k);
    });
  } catch (e) {}
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => getStoredItem('auditflow_token'));
  const [loading, setLoading] = useState(true);

  // Initialize user from isolated tab storage first
  const [user, setUser] = useState(() => {
    try {
      const savedUserStr = getStoredItem('auditflow_user');
      if (savedUserStr) return JSON.parse(savedUserStr);
    } catch (e) {}
    return null;
  });

  // Verify active profile on load if token exists
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const savedToken = getStoredItem('auditflow_token');
        const savedUserStr = getStoredItem('auditflow_user');

        if (savedToken && savedUserStr) {
          try {
            const parsedUser = JSON.parse(savedUserStr);
            setUser(parsedUser);
            setToken(savedToken);
          } catch (e) {}
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

    setStoredItem('auditflow_token', res.token);
    setStoredItem('auditflow_user', JSON.stringify(res.user));
    sessionStorage.setItem('auditflow_view_mode', 'app');
    sessionStorage.setItem('auditflow_active_tab', 'dashboard');
    return res;
  };

  const register = async (userData) => {
    const res = await api.auth.register(userData);
    if (res.token && res.user && res.user.approvalStatus !== 'pending') {
      setToken(res.token);
      setUser(res.user);
      setStoredItem('auditflow_token', res.token);
      setStoredItem('auditflow_user', JSON.stringify(res.user));
      sessionStorage.setItem('auditflow_view_mode', 'app');
      sessionStorage.setItem('auditflow_active_tab', 'dashboard');
    }
    return res;
  };

  const updateProfile = async (profileData) => {
    try {
      if (api.auth?.updateProfile) {
        const updated = await api.auth.updateProfile(profileData);
        setUser(updated);
        setStoredItem('auditflow_user', JSON.stringify(updated));
        return updated;
      }
    } catch (e) {
      console.warn('Backend updateProfile failed, updating local state:', e);
    }
    const updated = { ...(user || {}), ...profileData };
    setUser(updated);
    setStoredItem('auditflow_user', JSON.stringify(updated));
    return updated;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    clearStoredAuth();
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
