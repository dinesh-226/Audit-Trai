import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ContainerQrModal } from './components/ContainerQrModal';
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
import { UsersPage } from './pages/UsersPage';

function MainApp() {
  const { user, token, loading } = useAuth();
  
  // High-level view mode: 'app' | 'landing' | 'login' | 'register'
  const [viewMode, setViewMode] = useState('landing');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedShipId, setSelectedShipId] = useState(null);
  const [selectedContainerId, setSelectedContainerId] = useState(null);
  const [timelineContainerId, setTimelineContainerId] = useState(null);

  // Modals state
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [qrModalContainer, setQrModalContainer] = useState(null);
  const [showTamperModal, setShowTamperModal] = useState(false);
  const [editingShip, setEditingShip] = useState(null);
  const [showShipModal, setShowShipModal] = useState(false);
  const [editingContainer, setEditingContainer] = useState(null);
  const [showContainerModal, setShowContainerModal] = useState(false);
  const [inspectionContainerId, setInspectionContainerId] = useState(null);
  const [evidenceContainerId, setEvidenceContainerId] = useState(null);

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
    setActiveTab('dashboard');
  };

  // If viewing the public Landing Page
  if (viewMode === 'landing') {
    return (
      <LandingPage
        onLaunchApp={() => setViewMode('app')}
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
      />

      {/* Main Content Pane */}
      <div className="main-content">
        <Navbar
          onOpenGlobalSearch={() => setShowGlobalSearch(true)}
          onOpenProfile={() => setActiveTab('profile')}
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
            onOpenQr={(c) => setQrModalContainer(c)}
            onOpenTamperModal={() => setShowTamperModal(true)}
          />
        )}

        {activeTab === 'ships' && (
          <ShipsPage
            onSelectShip={handleSelectShip}
            onOpenShipModal={handleOpenShipModal}
          />
        )}

        {activeTab === 'ship-detail' && (
          <ShipDetailPage
            shipId={selectedShipId}
            onBack={() => setActiveTab('ships')}
            onSelectContainer={handleSelectContainer}
            onOpenQr={(c) => setQrModalContainer(c)}
            onOpenShipModal={handleOpenShipModal}
          />
        )}

        {activeTab === 'containers' && (
          <ContainersPage
            onSelectContainer={handleSelectContainer}
            onOpenTimeline={handleOpenTimeline}
            onOpenQr={(c) => setQrModalContainer(c)}
            onOpenContainerModal={handleOpenContainerModal}
          />
        )}

        {activeTab === 'container-detail' && (
          <ContainerDetailPage
            containerId={selectedContainerId}
            onBack={() => setActiveTab('containers')}
            onOpenTimeline={handleOpenTimeline}
            onOpenQr={(c) => setQrModalContainer(c)}
            onOpenInspection={(cId) => setInspectionContainerId(cId)}
            onOpenEvidence={(cId) => setEvidenceContainerId(cId)}
          />
        )}

        {activeTab === 'timeline' && (
          <ContainerTimelinePage
            initialContainerId={timelineContainerId}
            onBack={() => setActiveTab('containers')}
            onOpenQr={(c) => setQrModalContainer(c)}
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
          <InspectionsPage onOpenInspectionModal={(cId) => setInspectionContainerId(cId || null)} />
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

        {activeTab === 'reports' && (
          <ReportsPage />
        )}

        {activeTab === 'users' && (
          <UsersPage />
        )}

        {activeTab === 'profile' && (
          <ProfilePage />
        )}

        {activeTab === 'settings' && (
          <div className="page-wrapper">
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.8px' }}>
              SECURITY & SYSTEM GOVERNANCE
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 20px 0' }}>
              System Settings & Blockchain Ledger Controls
            </h1>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              <div className="maritime-card" style={{ padding: '24px' }}>
                <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Blockchain Ledger Security
                </h3>
                <p style={{ fontSize: '13px', color: '#475569', marginBottom: '16px', lineHeight: 1.5 }}>
                  Forward SHA-256 block chaining is active. Every database write is cryptographically sealed.
                </p>
                <button onClick={() => setShowTamperModal(true)} className="btn btn-secondary">
                  Open Tamper Simulator
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
                      await fetch('/api/system/reseed', { method: 'POST' });
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

      {/* Container QR Shipping Pass Modal */}
      {qrModalContainer && (
        <ContainerQrModal
          container={qrModalContainer}
          onClose={() => setQrModalContainer(null)}
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
      {inspectionContainerId && (
        <InspectionModal
          containerId={inspectionContainerId}
          onClose={() => setInspectionContainerId(null)}
          onSaved={() => {
            // reloaded
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
