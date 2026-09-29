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
  Radio,
  ExternalLink,
  Globe,
  LogOut,
  User
} from 'lucide-react';

export const Sidebar = ({ activeTab, setActiveTab, onGoToLanding }) => {
  const { user, logout } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'ships',
      label: 'Ships Fleet',
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
      label: 'Live AIS Tracking',
      icon: MapPin,
      roles: ['admin', 'port_manager', 'ship_manager', 'viewer']
    },
    {
      id: 'audit',
      label: 'Audit Trail (SHA-256)',
      icon: ShieldCheck,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'anomalies',
      label: 'Anomaly Detection',
      icon: AlertTriangle,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector']
    },
    {
      id: 'risk',
      label: 'Risk Analysis',
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
      label: 'Evidence Vault',
      icon: FolderLock,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'alerts',
      label: 'Alerts & Events',
      icon: Bell,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'ai-assistant',
      label: 'AI Audit Assistant',
      icon: Sparkles,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer'],
      highlight: true
    },
    {
      id: 'reports',
      label: 'Audit Reports',
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
      label: 'My Profile & Keys',
      icon: User,
      roles: ['admin', 'port_manager', 'ship_manager', 'inspector', 'viewer']
    },
    {
      id: 'settings',
      label: 'System & Security',
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
      boxShadow: '2px 0 8px 0 rgba(15, 23, 42, 0.03)'
    }}>
      {/* Brand Header */}
      <div style={{
        padding: '20px 20px 18px 20px',
        borderBottom: '1px solid #f1f5f9'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #0f3460 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 10px rgba(15, 52, 96, 0.25)',
            flexShrink: 0
          }}>
            <Anchor size={20} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', margin: 0, lineHeight: 1.2 }}>
              CONTAINERSHIP
            </h1>
            <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700, letterSpacing: '0.6px' }}>
              AUDIT TRAIL & AIS
            </div>
          </div>
        </div>

        {/* Quick Back to Landing Page Link */}
        {onGoToLanding && (
          <button
            onClick={onGoToLanding}
            style={{
              marginTop: '14px',
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              padding: '7px 12px',
              borderRadius: '8px',
              color: '#0f3460',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#e0f2fe';
              e.currentTarget.style.borderColor = '#bae6fd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#f8fafc';
              e.currentTarget.style.borderColor = '#e2e8f0';
            }}
          >
            <Globe size={13} color="#0284c7" />
            <span>View Public Landing Page</span>
          </button>
        )}
      </div>

      {/* Navigation Items List */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: '16px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        <div style={{
          padding: '4px 12px 8px 12px',
          fontSize: '10px',
          fontWeight: 800,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          OPERATIONAL MODULES
        </div>

        {visibleItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                background: isActive ? '#0f3460' : 'transparent',
                border: 'none',
                color: isActive ? '#ffffff' : (item.highlight ? '#0369a1' : '#475569'),
                fontSize: '13px',
                fontWeight: isActive ? 700 : 500,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                position: 'relative'
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = '#f1f5f9';
                  e.currentTarget.style.color = '#0f172a';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = item.highlight ? '#0369a1' : '#475569';
                }
              }}
            >
              <Icon
                size={18}
                color={isActive ? '#ffffff' : (item.highlight ? '#0284c7' : '#64748b')}
              />
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.highlight && !isActive && (
                <span style={{
                  padding: '2px 6px',
                  borderRadius: '999px',
                  fontSize: '9px',
                  fontWeight: 800,
                  background: '#e0f2fe',
                  color: '#0369a1',
                  border: '1px solid #bae6fd'
                }}>AI</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status Card */}
      <div style={{
        padding: '14px 16px',
        borderTop: '1px solid #f1f5f9',
        background: '#f8fafc'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px'
        }}>
          <span className="pulse-dot" />
          <span style={{ fontSize: '11px', color: '#15803d', fontWeight: 700 }}>
            AIS TELEMETRY: ACTIVE
          </span>
        </div>
        <div style={{ fontSize: '10px', color: '#64748b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>SHA-256 Ledger Sealed</span>
          <span style={{ fontWeight: 700, color: '#0f3460' }}>v2.4</span>
        </div>
      </div>
    </aside>
  );
};
