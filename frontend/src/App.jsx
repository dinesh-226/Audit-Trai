import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { TamperSimulatorModal } from './components/TamperSimulatorModal';
import { ShipModal } from './components/ShipModal';
import { ContainerModal } from './components/ContainerModal';
import { InspectionModal } from './components/InspectionModal';
import { EvidenceModal } from './components/EvidenceModal';

import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ProfilePage } from './pages/ProfilePage';
import { Dashboard } from './pages/Dashboard';
import { ShipsPage } from './pages/ShipsPage';
import { ShipDetailPage } from './pages/ShipDetailPage';
import { ContainersPage } from './pages/ContainersPage';
import { ContainerDetailPage } from './pages/ContainerDetailPage';
import { ContainerTimelinePage } from './pages/ContainerTimelinePage';
import { LiveTrackingPage } from './pages/LiveTrackingPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { AnomaliesPage } from './pages/AnomaliesPage';
import { RiskAnalysisPage } from './pages/RiskAnalysisPage';
import { InspectionsPage } from './pages/InspectionsPage';
import { EvidenceVaultPage } from './pages/EvidenceVaultPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { ReportsPage } from './pages/ReportsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { TemperatureMonitoringPage } from './pages/TemperatureMonitoringPage';
import { ShipTimelinePage } from './pages/ShipTimelinePage';
import { UsersPage } from './pages/UsersPage';

function MainApp() {
  const { user, token, loading, logout } = useAuth();
  
  // High-level view mode: 'app' | 'landing' | 'login' | 'register'
  const [viewMode, setViewMode] = useState(() => {
    try {
      const savedMode = localStorage.getItem('auditflow_view_mode');
      const savedToken = localStorage.getItem('auditflow_token');
      if (savedToken) {
        if (savedMode === 'login' || savedMode === 'register') return 'app';
        return savedMode || 'app';
      }
      return savedMode || 'landing';
    } catch (e) {
      return 'landing';
    }
  });

  const [activeTab, setActiveTab] = useState(() => {
    try {
      return localStorage.getItem('auditflow_active_tab') || 'dashboard';
    } catch (e) {
      return 'dashboard';
    }
  });

  const [selectedShipId, setSelectedShipId] = useState(() => {
    try {
      return localStorage.getItem('auditflow_selected_ship_id') || null;
    } catch (e) {
      return null;
    }
  });

  const [selectedContainerId, setSelectedContainerId] = useState(() => {
    try {
      return localStorage.getItem('auditflow_selected_container_id') || null;
    } catch (e) {
      return null;
    }
  });

  const [timelineContainerId, setTimelineContainerId] = useState(() => {
    try {
      return localStorage.getItem('auditflow_timeline_container_id') || null;
    } catch (e) {
      return null;
    }
  });

  // Modals state
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showTamperModal, setShowTamperModal] = useState(false);
  const [editingShip, setEditingShip] = useState(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [showContainerModal, setShowContainerModal] = useState(false);
  const [inspectionContainerId, setInspectionContainerId] = useState(null);
  const [showInspectionModal, setShowInspectionModal] = useState(false);
  const [inspectionRefreshKey, setInspectionRefreshKey] = useState(0);
  const [evidenceContainerId, setEvidenceContainerId] = useState(null);

  const handleOpenInspectionModal = (containerId = null) => {
    setInspectionContainerId(containerId);
    setShowInspectionModal(true);
  };

  // Persist viewMode
  useEffect(() => {
    try {
      localStorage.setItem('auditflow_view_mode', viewMode);
    } catch (e) {}
  }, [viewMode]);

  // Persist activeTab
  useEffect(() => {
    try {
      localStorage.setItem('auditflow_active_tab', activeTab);
    } catch (e) {}
  }, [activeTab]);

  // Persist selectedShipId
  useEffect(() => {
    try {
      if (selectedShipId) {
        localStorage.setItem('auditflow_selected_ship_id', selectedShipId);
      } else {
        localStorage.removeItem('auditflow_selected_ship_id');
      }
    } catch (e) {}
  }, [selectedShipId]);

  // Persist selectedContainerId
  useEffect(() => {
    try {
      if (selectedContainerId) {
        localStorage.setItem('auditflow_selected_container_id', selectedContainerId);
      } else {
        localStorage.removeItem('auditflow_selected_container_id');
      }
    } catch (e) {}
  }, [selectedContainerId]);

  // Persist timelineContainerId
  useEffect(() => {
    try {
      if (timelineContainerId) {
        localStorage.setItem('auditflow_timeline_container_id', timelineContainerId);
      } else {
        localStorage.removeItem('auditflow_timeline_container_id');
      }
    } catch (e) {}
  }, [timelineContainerId]);

  // Global Ctrl+K shortcut for search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Synchronize auth state with viewMode
  useEffect(() => {
    if (!loading) {
      if ((user || token) && viewMode === 'landing') {
        const savedMode = localStorage.getItem('auditflow_view_mode');
        if (savedMode === 'app') {
          setViewMode('app');
        }
      } else if (!user && !token && viewMode === 'app') {
        setViewMode('landing');
        setActiveTab('dashboard');
      }
    }
  }, [user, token, loading, viewMode]);

  const handleSignOut = () => {
    logout();
    try {
      localStorage.removeItem('auditflow_view_mode');
      localStorage.removeItem('auditflow_active_tab');
      localStorage.removeItem('auditflow_selected_ship_id');
      localStorage.removeItem('auditflow_selected_container_id');
      localStorage.removeItem('auditflow_timeline_container_id');
    } catch (e) {}
    setViewMode('landing');
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#0f3460'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div className="pulse-dot" style={{ width: '16px', height: '16px', marginBottom: '16px' }} />
          <div style={{ fontSize: '14px', fontWeight: 800, letterSpacing: '1px', color: '#0f3460' }}>
            INITIALIZING MARITIME AUDIT LEDGER...
          </div>
        </div>
      </div>
    );
  }

  const handleAuthSuccess = (authUser) => {
    setViewMode('app');
    const savedTab = localStorage.getItem('auditflow_active_tab');
    setActiveTab(savedTab && savedTab !== 'login' && savedTab !== 'register' ? savedTab : 'dashboard');
  };

  // If viewing the public Landing Page
  if (viewMode === 'landing') {
    return (
      <LandingPage
        onLaunchApp={() => {
          if (user) {
            setViewMode('app');
          } else {
            setViewMode('login');
          }
        }}
        onOpenLogin={() => setViewMode('login')}
        onOpenRegister={() => setViewMode('register')}
      />
    );
  }

  // If viewing dedicated Login Page
  if (viewMode === 'login' || viewMode === 'auth-login') {
    return (
      <Login
        onBackToHome={() => setViewMode('landing')}
        onGoToRegister={() => setViewMode('register')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  // If viewing dedicated Register Page
  if (viewMode === 'register' || viewMode === 'auth-register') {
    return (
      <Register
        onBackToHome={() => setViewMode('landing')}
        onGoToLogin={() => setViewMode('login')}
        onSuccess={handleAuthSuccess}
      />
    );
  }

  // Navigation handlers
  const handleSelectShip = (ship) => {
    setSelectedShipId(ship.shipId);
    setActiveTab('ship-detail');
  };

  const handleSelectContainer = (container) => {
    setSelectedContainerId(container.containerId);
    setActiveTab('container-detail');
  };

  const handleOpenTimeline = (containerId) => {
    setTimelineContainerId(containerId);
    setActiveTab('timeline');
  };

  const handleOpenShipModal = (ship = null) => {
    setEditingShip(ship);
    setShowShipModal(true);
  };

  const handleOpenContainerModal = (container = null) => {
    setEditingContainer(container);
    setShowContainerModal(true);
  };

  return (
    <div className="app-container">
      {/* Fixed Light Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onGoToLanding={() => setViewMode('landing')}
        onSignOut={handleSignOut}
      />

      {/* Main Content Pane */}
      <div className="main-content">
        <Navbar
          onOpenGlobalSearch={() => setShowGlobalSearch(true)}
          onOpenProfile={() => setActiveTab('profile')}
          onSignOut={handleSignOut}
        />

        {/* Dynamic Page Rendering */}
        {activeTab === 'dashboard' && (
          <Dashboard
            onNavigate={(tab, param) => {
              if (tab === 'timeline') {
                setTimelineContainerId(param);
                setActiveTab('timeline');
              } else {
                setActiveTab(tab);
              }
            }}
            onOpenTamperModal={() => setShowTamperModal(true)}
          />
        )}

        {activeTab === 'ships' && (
          <ShipsPage
            onSelectShip={handleSelectShip}
            onOpenShipModal={handleOpenShipModal}
            onNavigate={(tab, id) => {
              if (tab === 'ship-timeline' && id) setSelectedShipId(id);
              if (tab === 'ship-detail' && id) setSelectedShipId(id);
              setActiveTab(tab);
            }}
          />
        )}

        {activeTab === 'ship-detail' && (
          <ShipDetailPage
            shipId={selectedShipId}
            onBack={() => setActiveTab('ships')}
            onSelectContainer={handleSelectContainer}
            onOpenShipModal={handleOpenShipModal}
            onNavigate={(tab, id) => {
              if (tab === 'ship-timeline' && id) setSelectedShipId(id);
              if (tab === 'timeline' && id) setTimelineContainerId(id);
              setActiveTab(tab);
            }}
          />
        )}

        {activeTab === 'containers' && (
          <ContainersPage
            onSelectContainer={handleSelectContainer}
            onOpenTimeline={handleOpenTimeline}
            onOpenContainerModal={handleOpenContainerModal}
          />
        )}

        {activeTab === 'container-detail' && (
          <ContainerDetailPage
            containerId={selectedContainerId}
            onBack={() => setActiveTab('containers')}
            onOpenTimeline={handleOpenTimeline}
            onOpenInspection={handleOpenInspectionModal}
            onOpenEvidence={(cId) => setEvidenceContainerId(cId)}
          />
        )}

        {activeTab === 'timeline' && (
          <ContainerTimelinePage
            initialContainerId={timelineContainerId}
            onBack={() => setActiveTab('containers')}
          />
        )}

        {activeTab === 'tracking' && (
          <LiveTrackingPage onSelectShip={handleSelectShip} />
        )}

        {activeTab === 'audit' && (
          <AuditLogsPage onOpenTamperModal={() => setShowTamperModal(true)} />
        )}

        {activeTab === 'anomalies' && (
          <AnomaliesPage />
        )}

        {activeTab === 'risk' && (
          <RiskAnalysisPage onSelectContainer={handleSelectContainer} />
        )}

        {activeTab === 'inspections' && (
          <InspectionsPage
            onOpenInspectionModal={handleOpenInspectionModal}
            refreshKey={inspectionRefreshKey}
          />
        )}

        {activeTab === 'evidence' && (
          <EvidenceVaultPage onOpenEvidenceModal={(cId) => setEvidenceContainerId(cId || null)} />
        )}

        {activeTab === 'alerts' && (
          <AnomaliesPage />
        )}

        {activeTab === 'ai-assistant' && (
          <AiAssistantPage />
        )}

        {activeTab === 'ship-timeline' && (
          <ShipTimelinePage
            initialShipId={selectedShipId}
            onNavigate={(tab, id) => {
              if (tab === 'ship-detail' && id) {
                setSelectedShipId(id);
              }
              if (tab === 'timeline' && id) {
                setTimelineContainerId(id);
              }
              setActiveTab(tab);
            }}
          />
        )}

        {activeTab === 'temperature' && (
          <AnalyticsPage
            initialTab="temperature"
            onNavigate={(tab, id) => {
              setActiveTab(tab);
              if (tab === 'timeline' && id) setTimelineContainerId(id);
            }}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsPage
            onNavigate={(tab, id) => {
              setActiveTab(tab);
              if (tab === 'timeline' && id) setTimelineContainerId(id);
            }}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsPage />
        )}

        {activeTab === 'users' && (
          <UsersPage />
        )}

        {activeTab === 'profile' && (
          <ProfilePage onSignOut={handleSignOut} />
        )}

        {activeTab === 'settings' && (
          <div className="page-wrapper">
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.8px' }}>
              SECURITY & SYSTEM GOVERNANCE
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 20px 0' }}>
              System Settings & Maritime Audit Trail Controls
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div className="maritime-card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Audit Trail Security & Verification
                </h3>
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', lineHeight: 1.5 }}>
                  Forward SHA-256 audit chaining is active. Every database write is cryptographically logged and sealed.
                </p>
                <button onClick={() => setShowTamperModal(true)} className="btn btn-secondary">
                  System Integrity & Tamper Test
                </button>
              </div>

              <div className="maritime-card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Reset & Reseed Demo Data
                </h3>
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', lineHeight: 1.5 }}>
                  Restore all vessels, containers, and valid hash chains to fresh demo state.
                </p>
                <button
                  onClick={async () => {
                    if (confirm('Re-seed database with fresh demo data?')) {
                      await api.system.reseed();
                      window.location.reload();
                    }
                  }}
                  className="btn btn-outline"
                >
                  Reset Demo Dataset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Global Spotlight Search Modal */}
      {showGlobalSearch && (
        <GlobalSearchModal
          onClose={() => setShowGlobalSearch(false)}
          onSelectContainer={(c) => {
            setSelectedContainerId(c.containerId);
            setActiveTab('container-detail');
          }}
          onSelectShip={handleSelectShip}
          onNavigateTab={(tab) => setActiveTab(tab)}
        />
      )}

      {/* Cryptographic Tamper Simulator Modal */}
      {showTamperModal && (
        <TamperSimulatorModal
          onClose={() => setShowTamperModal(false)}
          onTamperExecuted={() => {
            // refresh data
          }}
        />
      )}

      {/* Ship Modal */}
      {showShipModal && (
        <ShipModal
          ship={editingShip}
          onClose={() => setShowShipModal(false)}
          onSaved={() => {
            // reloaded in ships page
          }}
        />
      )}

      {/* Container Modal */}
      {showContainerModal && (
        <ContainerModal
          container={editingContainer}
          onClose={() => setShowContainerModal(false)}
          onSaved={() => {
            // reloaded in containers page
          }}
        />
      )}

      {/* Inspection Modal */}
      {showInspectionModal && (
        <InspectionModal
          containerId={inspectionContainerId || ''}
          onClose={() => {
            setShowInspectionModal(false);
            setInspectionContainerId(null);
          }}
          onSaved={() => {
            setInspectionRefreshKey(key => key + 1);
          }}
        />
      )}

      {/* Evidence Modal */}
      {evidenceContainerId && (
        <EvidenceModal
          containerId={evidenceContainerId}
          onClose={() => setEvidenceContainerId(null)}
          onSaved={() => {
            // reloaded
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ErrorBoundary>
  );
}
