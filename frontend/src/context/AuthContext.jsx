import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('auditflow_token') || null);
  const [demoRole, setDemoRole] = useState(localStorage.getItem('auditflow_demo_role') || 'admin');
  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize user from localStorage if present
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('auditflow_user');
      if (savedUser) return JSON.parse(savedUser);
    } catch (e) {}
    return null;
  });

  // Load demo users and active profile
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const users = await api.auth.getDemoUsers();
        setDemoUsers(users || []);

        const savedToken = localStorage.getItem('auditflow_token');
        const savedUserStr = localStorage.getItem('auditflow_user');

        if (savedToken && savedUserStr) {
          try {
            const parsedUser = JSON.parse(savedUserStr);
            setUser(parsedUser);
            setDemoRole(parsedUser.role || 'admin');
          } catch (e) {
            // fallback
          }
        } else {
          const currentDemoRole = localStorage.getItem('auditflow_demo_role') || 'admin';
          const matchedUser = (users || []).find(u => u.role === currentDemoRole) || (users && users[0]);
          if (matchedUser) {
            setUser(matchedUser);
            setDemoRole(matchedUser.role);
          }
        }
      } catch (err) {
        console.warn('Could not load profile or demo users on init:', err);
        if (!user) {
          setUser({
            userId: 'USR-001',
            name: 'Capt. Rajesh Menon',
            email: 'admin@auditflow.com',
            role: 'admin',
            department: 'Fleet Governance & Cryptographic Security',
            assignedPort: 'Global Central Command',
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80'
          });
        }
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
    setDemoRole(res.user.role);
    localStorage.setItem('auditflow_token', res.token);
    localStorage.setItem('auditflow_user', JSON.stringify(res.user));
    localStorage.setItem('auditflow_demo_role', res.user.role);
    return res;
  };

  const register = async (userData) => {
    const res = await api.auth.register(userData);
    setToken(res.token);
    setUser(res.user);
    setDemoRole(res.user.role);
    localStorage.setItem('auditflow_token', res.token);
    localStorage.setItem('auditflow_user', JSON.stringify(res.user));
    localStorage.setItem('auditflow_demo_role', res.user.role);
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
    switchRole('viewer');
  };

  // Instant Demo Role Switcher
  const switchRole = (newRole) => {
    setDemoRole(newRole);
    localStorage.setItem('auditflow_demo_role', newRole);
    const matched = demoUsers.find(u => u.role === newRole);
    if (matched) {
      setUser(matched);
      localStorage.setItem('auditflow_user', JSON.stringify(matched));
    } else {
      setUser(prev => {
        const updated = { ...(prev || {}), role: newRole };
        localStorage.setItem('auditflow_user', JSON.stringify(updated));
        return updated;
      });
    }
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
        demoRole,
        demoUsers,
        loading,
        login,
        register,
        updateProfile,
        logout,
        switchRole,
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
