import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Ship,
  Box,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  Activity,
  ClipboardCheck,
  FolderLock,
  Bell,
  Sparkles,
  FileText,
  Users,
  Settings,
  Anchor,
  Globe,
  LogOut,
  User,
  BarChart3,
  Thermometer,
  Clock
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, onGoToLanding, onSignOut }) => {
  const { user, logout } = useAuth();

  const handleSignOut = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    logout();
    if (onSignOut) {
      onSignOut();
    } else if (onGoToLanding) {
      onGoToLanding();
    }
  };

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'ship-timeline',
      label: 'Ship Timeline',
      icon: Clock,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer'],
      highlight: true
    },
    {
      id: 'analytics',
      label: 'Reports & Analytics',
      icon: BarChart3,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'ships',
      label: 'Ships & Fleet',
      icon: Ship,
      roles: ['admin', 'port_manager', 'ship_manager', 'viewer']
    },
    {
      id: 'containers',
      label: 'Containers',
      icon: Box,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'tracking',
      label: 'Live Ship Map',
      icon: MapPin,
      roles: ['admin', 'port_manager', 'ship_manager', 'viewer']
    },
    {
      id: 'audit',
      label: 'Activity History',
      icon: ShieldCheck,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'anomalies',
      label: 'Alerts & Issues',
      icon: AlertTriangle,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector']
    },
    {
      id: 'risk',
      label: 'Safety & Risk Check',
      icon: Activity,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'inspections',
      label: 'Inspections',
      icon: ClipboardCheck,
      roles: ['admin', 'inspector', 'port_manager']
    },
    {
      id: 'evidence',
      label: 'Photos & Files',
      icon: FolderLock,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'ai-assistant',
      label: 'AI Assistant',
      icon: Sparkles,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: FileText,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'users',
      label: 'User Management',
      icon: Users,
      roles: ['admin']
    },
    {
      id: 'profile',
      label: 'My Profile',
      icon: User,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'settings',
      label: 'Settings & Security',
      icon: Settings,
      roles: ['admin']
    }
  ];

  const visibleItems = navItems.filter(item => {
    if (!user) return true;
    if (user.role === 'admin') return true;
    return item.roles.includes(user.role);
  });

  return (
    <aside style={{
      width: '260px',
      height: '100vh',
      background: '#ffffff',
      borderRight: '1px solid #e2e8f0',
      position: 'fixed',
      left: 0,
      top: 0,
      zIndex: 150,
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '1px 0 4px 0 rgba(15, 23, 42, 0.03)'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '18px 20px 16px 20px',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#0f3460',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 6px rgba(15, 52, 96, 0.2)',
            flexShrink: 0
          }}>
            <Anchor size={18} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '14px', fontWeight: 800, color: '#0f3460', letterSpacing: '-0.2px', margin: 0, lineHeight: 1.2 }}>
              CONTAINERSHIP
            </h1>
            <div style={{ fontSize: '10px', color: '#0284c7', fontWeight: 700, letterSpacing: '0.5px' }}>
              PORT & SHIP LOGISTICS
            </div>
          </div>
        </div>

        {/* Quick Back to Landing Page Link */}
        {onGoToLanding && (
          <button
            onClick={onGoToLanding}
            type="button"
            style={{
              marginTop: '12px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '6px 10px',
              borderRadius: '6px',
              color: '#0f3460',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f5fa';
              e.currentTarget.style.borderColor = '#0284c7';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <Globe size={12} color="#0284c7" />
            <span>Public Landing Page</span>
          </button>
        )}
      </div>

      {/* Navigation Items List */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: '12px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <div style={{
          padding: '4px 10px 6px 10px',
          fontSize: '10px',
          fontWeight: 800,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.8px'
        }}>
          MODULES
        </div>

        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: '8px',
                background: isActive ? '#0f3460' : 'transparent',
                border: 'none',
                color: isActive ? '#ffffff' : '#475569',
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#f0f5fa';
                  e.currentTarget.style.color = '#0f3460';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              <Icon
                size={16}
                color={isActive ? '#ffffff' : (item.highlight ? '#0284c7' : '#64748b')}
              />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.highlight && !isActive && (
                <span style={{
                  padding: '1px 5px',
                  borderRadius: '999px',
                  fontSize: '9px',
                  fontWeight: 800,
                  background: '#e0f2fe',
                  color: '#0284c7'
                }}>AI</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status & Sign Out */}
      <div style={{
        padding: '12px 14px',
        borderTop: '1px solid #f1f5f9',
        background: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-dot" style={{ width: '7px', height: '7px' }} />
            <span style={{ fontSize: '11px', color: '#0f3460', fontWeight: 700 }}>
              AIS Satellite Live
            </span>
          </div>
          <span style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>v2.4</span>
        </div>

        <button
          onClick={handleSignOut}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            color: '#475569',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 700,
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
          title="Sign Out of Terminal & Return to Landing Page"
        >
          <LogOut size={12} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
