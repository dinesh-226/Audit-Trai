import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  Search,
  Bell,
  User,
  ChevronDown
} from 'lucide-react';

export const Navbar = ({ onOpenGlobalSearch, onOpenProfile }) => {
  const { user, demoRole, switchRole, logout } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showAlertsDropdown, setShowAlertsDropdown] = useState(false);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000);
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

  return (
    <header style={{
      height: '70px',
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.03)'
    }}>
      {/* Left: Clean Global Search Input */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <button
          onClick={onOpenGlobalSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            color: '#64748b',
            padding: '9px 18px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            fontSize: '13px',
            minWidth: '380px',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#0284c7'; e.currentTarget.style.background = '#ffffff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = '#f8fafc'; }}
        >
          <Search size={16} color="#0284c7" />
          <span>Search containers (MSCU-7492014), vessels, ports...</span>
          <kbd style={{
            marginLeft: 'auto',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            padding: '2px 7px',
            borderRadius: '4px',
            fontSize: '11px',
            color: '#64748b',
            fontWeight: 600
          }}>Ctrl+K</kbd>
        </button>
      </div>

      {/* Right Controls: Role Selector, Notifications & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {/* Compact Demo Role Switcher */}
        <div style={{ position: 'relative' }}>
          <select
            value={demoRole}
            onChange={(e) => switchRole(e.target.value)}
            style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="admin">👑 Admin</option>
            <option value="port_manager">⚓ Port Manager</option>
            <option value="ship_manager">🚢 Ship Manager</option>
            <option value="inspector">🔍 Inspector</option>
            <option value="viewer">👁️ Viewer</option>
          </select>
        </div>

        {/* Real-time Alerts Notification Bell */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowAlertsDropdown(!showAlertsDropdown)}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              color: '#0f172a',
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f8fafc'}
          >
            <Bell size={18} color="#475569" />
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                background: '#dc2626',
                color: '#fff',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '10px',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {unreadCount}
              </span>
            )}
          </button>

          {/* Alerts Drawer */}
          {showAlertsDropdown && (
            <div style={{
              position: 'absolute',
              right: 0,
              top: '48px',
              width: '380px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '16px',
              boxShadow: 'var(--shadow-xl)',
              zIndex: 200,
              overflow: 'hidden'
            }}>
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ fontWeight: 700, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px', color: '#0f172a' }}>
                  <Bell size={16} color="#0284c7" />
                  <span>Real-Time Notifications</span>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    style={{ background: 'none', border: 'none', color: '#0284c7', fontSize: '11px', cursor: 'pointer', fontWeight: 700 }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {alerts.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                    No recent alerts recorded.
                  </div>
                ) : (
                  alerts.map((alert) => (
                    <div
                      key={alert.alertId}
                      style={{
                        padding: '14px 20px',
                        borderBottom: '1px solid #f1f5f9',
                        background: alert.isRead ? '#ffffff' : '#f8fafc',
                        transition: 'background 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: alert.severity === 'critical' || alert.severity === 'high' ? '#dc2626' : '#0284c7' }}>
                          {alert.title}
                        </span>
                        <span style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {new Date(alert.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', lineHeight: '1.4' }}>
                        {alert.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Profile Button / Avatar in Navbar (Clicking navigates to Profile Page) */}
        <button
          onClick={onOpenProfile}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            padding: '5px 12px 5px 6px',
            borderRadius: '999px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#e0f2fe';
            e.currentTarget.style.borderColor = '#bae6fd';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#f8fafc';
            e.currentTarget.style.borderColor = '#e2e8f0';
          }}
          title="Open Officer Profile & Settings"
        >
          <div style={{ position: 'relative' }}>
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
              alt={user?.name || 'User Avatar'}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: '2px solid #0284c7',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <span style={{
              position: 'absolute',
              bottom: '-1px',
              right: '-1px',
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              background: '#10b981',
              border: '1.5px solid #ffffff'
            }} />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', paddingRight: '4px' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
              {user?.name || 'Maritime Officer'}
            </span>
            <span style={{ fontSize: '10px', color: '#0284c7', fontWeight: 700, textTransform: 'capitalize' }}>
              {user?.role?.replace('_', ' ') || 'Officer'} &bull; Profile
            </span>
          </div>

          <User size={14} color="#64748b" />
        </button>
      </div>
    </header>
  );
};
