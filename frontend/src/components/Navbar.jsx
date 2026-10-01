import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Search,
  Bell,
  User,
  LogOut,
  Shield,
  Anchor,
  Ship,
  ClipboardCheck,
  Eye,
  ChevronDown,
  Check,
  Settings,
  Key
} from 'lucide-react';

export const Navbar = ({ onOpenGlobalSearch, onOpenProfile, onSignOut }) => {
  const { user, logout } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const alertsRef = useRef(null);
  const userRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (alertsRef.current && !alertsRef.current.contains(e.target)) {
        setShowAlertsDropdown(false);
      }
      if (userRef.current && !userRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    logout();
    if (onSignOut) {
      onSignOut();
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 20000);
    return () => clearInterval(interval);
  }, []);

  const fetchAlerts = async () => {
    try {
      const data = await api.alerts.getAll({ limit: 5 });
      setAlerts(data.alerts || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (e) {
      // Ignore background poll errors
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.alerts.markAllRead();
      setUnreadCount(0);
      setAlerts(prev => prev.map(a => ({ ...a, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  // Role Configuration in Disciplined Two-Color Theme (Navy #0f3460 + Ocean Blue #0284c7)
  const getRoleConfig = (role) => {
    switch (role) {
      case 'admin':
        return {
          title: 'Admin',
          icon: Shield,
          port: user?.assignedPort || 'Headquarters'
        };
      case 'port_manager':
        return {
          title: 'Port Manager',
          icon: Anchor,
          port: user?.assignedPort || 'Mumbai Port'
        };
      case 'ship_manager':
        return {
          title: 'Ship Manager',
          icon: Ship,
          port: user?.assignedShipId ? `Ship: ${user.assignedShipId}` : (user?.assignedPort || 'Fleet Operations')
        };
      case 'inspector':
        return {
          title: 'Inspector',
          icon: ClipboardCheck,
          port: user?.assignedPort || 'Port Inspection'
        };
      case 'viewer':
      default:
        return {
          title: 'Viewer',
          icon: Eye,
          port: user?.assignedPort || 'Public Access'
        };
    }
  };

  const roleConfig = getRoleConfig(user?.role);
  const RoleIcon = roleConfig.icon;

  return (
    <header style={{
      height: '64px',
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 28px',
      boxShadow: '0 1px 3px 0 rgba(15, 23, 42, 0.04)'
    }}>
      {/* Left: Refined Search Bar */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          onClick={onOpenGlobalSearch}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            padding: '7px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            width: '320px',
            transition: 'all 0.15s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#0284c7';
            e.currentTarget.style.background = '#ffffff';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.background = '#f8fafc';
          }}
        >
          <Search size={15} color="#0284c7" />
          <span style={{ fontSize: '12px' }}>Search containers, ships, ports...</span>
          <kbd style={{
            marginLeft: 'auto',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '1px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            color: '#64748b',
            fontWeight: 700,
            fontFamily: 'inherit'
          }}>Ctrl+K</kbd>
        </button>
      </div>

      {/* Right: Clean Role Pill, Notification Bell, User Menu & Sign Out */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        
        {/* Role & Station Pill (Clean Two-Tone Navy/Ocean Blue) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: '#f0f5fa',
          border: '1px solid #cbd9e8',
          padding: '5px 12px',
          borderRadius: '999px',
          fontSize: '12px'
        }}>
          <RoleIcon size={14} color="#0f3460" />
          <span style={{ fontWeight: 700, color: '#0f3460' }}>
            {roleConfig.title}
          </span>
          <span style={{ color: '#94a3b8', fontSize: '11px' }}>|</span>
          <span style={{ color: '#0284c7', fontWeight: 600, fontSize: '11px' }}>
            {roleConfig.port}
          </span>
        </div>

        {/* Notifications Icon with Dropdown */}
        <div style={{ position: 'relative' }} ref={alertsRef}>
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            type="button"
            style={{
              background: showAlertsDropdown ? '#f0f5fa' : '#ffffff',
              border: '1px solid #e2e8f0',
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284c7'; }}
            onMouseLeave={(e) => { if (!showAlertsDropdown) e.currentTarget.style.borderColor = '#e2e8f0'; }}
            title="System Notifications"
          >
            <Bell size={16} color="#0f3460" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-3px',
                right: '-3px',
                background: '#0284c7',
                color: '#ffffff',
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                fontSize: '9px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Alerts Dropdown Drawer */}
          {showAlertsDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '44px',
              width: '340px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 200,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f8fafc'
              }}>
                <div style={{ fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#0f3460' }}>
                  <Bell size={14} color="#0284c7" />
                  <span>Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    type="button"
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Mark read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {alerts.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                    No unread notifications.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.alertId}
                      style={{
                        padding: '10px 16px',
                        borderBottom: '1px solid #f1f5f9',
                        background: alert.isRead ? '#ffffff' : '#f0f9ff',
                        fontSize: '12px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 700, color: alert.severity === 'critical' ? '#dc2626' : '#0f3460' }}>
                          {alert.title}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ color: '#475569', fontSize: '11px', lineHeight: '1.4' }}>
                        {alert.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Button with Dropdown */}
        <div style={{ position: 'relative' }} ref={userRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#ffffff',
              border: '1px solid #e2e8f0',
              padding: '4px 10px 4px 5px',
              borderRadius: '999px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#0284c7';
              e.currentTarget.style.background = '#f8fafc';
            }}
            onMouseLeave={(e) => {
              if (!showUserDropdown) {
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.background = '#ffffff';
              }
            }}
          >
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'Avatar'}
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '1.5px solid #0f3460'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                {user?.name || 'Officer'}
              </span>
            </div>
            <ChevronDown size={13} color="#64748b" />
          </button>

          {/* User Profile Dropdown Menu */}
          {showUserDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '42px',
              width: '220px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 200,
              padding: '6px',
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{user?.name}</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>{user?.email}</div>
              </div>

              <button
                onClick={() => {
                  setShowUserDropdown(false);
                  if (onOpenProfile) onOpenProfile();
                }}
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#334155',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <User size={14} color="#0284c7" />
                <span>My Profile & Security</span>
              </button>

              <button
                onClick={(e) => {
                  setShowUserDropdown(false);
                  handleSignOut(e);
                }}
                type="button"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#dc2626',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  width: '100%',
                  textAlign: 'left',
                  marginTop: '4px',
                  borderTop: '1px solid #f1f5f9'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
              >
                <LogOut size={14} color="#dc2626" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

        {/* Minimal Direct Sign Out Button */}
        <button
          onClick={handleSignOut}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#475569',
            padding: '6px 10px',
            borderRadius: '8px',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#fca5a5';
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.background = '#fef2f2';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#e2e8f0';
            e.currentTarget.style.color = '#475569';
            e.currentTarget.style.background = '#ffffff';
          }}
          title="Sign Out"
        >
          <LogOut size={13} />
          <span>Exit</span>
        </button>

      </div>
    </header>
  );
};

export default Navbar;
