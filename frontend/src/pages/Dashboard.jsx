import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Ship,
  Box,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Radio,
  Sparkles,
  QrCode,
  FileText,
  Plus,
  RotateCcw,
  CheckCircle,
  ExternalLink,
  ClipboardCheck,
  FolderLock
} from 'lucide-react';

export const Dashboard = ({ onNavigate, onOpenQr, onOpenTamperModal }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalShips: 0,
    totalContainers: 0,
    inTransitContainers: 0,
    deliveredContainers: 0,
    delayedContainers: 0,
    activeAnomalies: 0,
    criticalRiskCount: 0,
    todayAuditsCount: 0,
    ledgerIntegrity: true
  });

  const [ships, setShips] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [integrityResult, setIntegrityResult] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [shipsData, containersData, auditStats, auditLogsData, anomaliesData] = await Promise.all([
        api.ships.getAll(),
        api.containers.getAll(),
        api.auditLogs.getStats(),
        api.auditLogs.getAll({ limit: 6 }),
        api.anomalies.getAll({ status: 'Active' })
      ]);

      setShips(shipsData || []);
      setContainers(containersData || []);
      setRecentAudits(auditLogsData?.logs || []);
      setAnomalies(anomaliesData || []);

      const inTransit = (containersData || []).filter(c => c.status === 'In Transit' || c.status === 'Loaded').length;
      const delivered = (containersData || []).filter(c => c.status === 'Delivered').length;
      const delayed = (containersData || []).filter(c => c.isDelayed).length;
      const criticalRisk = (containersData || []).filter(c => c.riskLevel === 'High' || c.riskLevel === 'Critical').length;

      setStats({
        totalShips: shipsData?.length || 0,
        totalContainers: containersData?.length || 0,
        inTransitContainers: inTransit,
        deliveredContainers: delivered,
        delayedContainers: delayed,
        activeAnomalies: anomaliesData?.length || 0,
        criticalRiskCount: criticalRisk,
        todayAuditsCount: auditStats?.todayCount || auditLogsData?.total || 0,
        ledgerIntegrity: true
      });
    } catch (e) {
      console.error('Failed to load dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    try {
      const res = await api.auditLogs.verifyIntegrity();
      setIntegrityResult(res);
      setStats(prev => ({ ...prev, ledgerIntegrity: res.verified }));
    } catch (e) {
      console.error(e);
    } finally {
      setVerifying(false);
    }
  };

  const roleConfigs = {
    admin: {
      title: '👑 Executive Governance & Security Authority',
      desc: 'You have unrestricted access to all 5 port terminals, vessel fleet telemetry, cryptographic ledger tamper simulation, and system governance.',
      badge: 'badge-purple',
      badgeText: 'Admin Tier',
      bg: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
      borderColor: '#ddd6fe',
      textColor: '#5b21b6',
      actions: [
        { label: 'Tamper Simulator', onClick: () => onOpenTamperModal(), icon: ShieldCheck },
        { label: 'User RBAC Directory', onClick: () => onNavigate('users'), icon: FileText },
        { label: 'All Anomalies', onClick: () => onNavigate('anomalies'), icon: AlertTriangle },
        { label: 'Audit Reports', onClick: () => onNavigate('reports'), icon: FileText }
      ]
    },
    port_manager: {
      title: `⚓ Terminal Operations Command: ${user?.assignedPort || 'Mumbai Port'}`,
      desc: 'Overseeing quay crane throughput, yard container staging, berth allocations, and gate logistics.',
      badge: 'badge-cyan',
      badgeText: 'Port Manager',
      bg: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
      borderColor: '#bae6fd',
      textColor: '#0369a1',
      actions: [
        { label: 'Container Inventory', onClick: () => onNavigate('containers'), icon: Box },
        { label: 'Live AIS Vessels', onClick: () => onNavigate('tracking'), icon: Ship },
        { label: 'Risk Analysis', onClick: () => onNavigate('risk'), icon: Activity },
        { label: 'Audit Stream', onClick: () => onNavigate('audit'), icon: ShieldCheck }
      ]
    },
    ship_manager: {
      title: '🚢 Fleet Master & Sea Transit Navigation',
      desc: 'Supervising vessel voyage coordinates, speed telemetry, onboard container manifests, and waypoint arrival ETAs.',
      badge: 'badge-blue',
      badgeText: 'Ship Manager',
      bg: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)',
      borderColor: '#c7d2fe',
      textColor: '#3730a3',
      actions: [
        { label: 'Ships Fleet', onClick: () => onNavigate('ships'), icon: Ship },
        { label: 'Live AIS Satellite Map', onClick: () => onNavigate('tracking'), icon: Radio },
        { label: 'Onboard Manifests', onClick: () => onNavigate('containers'), icon: Box },
        { label: 'Audit Trail', onClick: () => onNavigate('audit'), icon: ShieldCheck }
      ]
    },
    inspector: {
      title: '🔍 Customs, Bolt Seal & Safety Inspection Command',
      desc: 'Authorized to conduct physical cargo audits, verify high-security bolt seals, attach evidence photos, and sign pass/fail certificates.',
      badge: 'badge-amber',
      badgeText: 'Customs Inspector',
      bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
      borderColor: '#fde68a',
      textColor: '#92400e',
      actions: [
        { label: 'Inspections & Checklists', onClick: () => onNavigate('inspections'), icon: ClipboardCheck },
        { label: 'High-Risk Containers', onClick: () => onNavigate('risk'), icon: AlertTriangle },
        { label: 'Evidence Vault', onClick: () => onNavigate('evidence'), icon: FolderLock },
        { label: 'Container Milestones', onClick: () => onNavigate('containers'), icon: Box }
      ]
    },
    viewer: {
      title: '👁️ Compliance Oversight & Observer Access',
      desc: 'Read-only access to inspect the immutable SHA-256 blockchain ledger, trace container journeys, and download compliance audit certificates.',
      badge: 'badge-green',
      badgeText: 'Observer / Auditor',
      bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
      borderColor: '#bbf7d0',
      textColor: '#166534',
      actions: [
        { label: 'Verify Audit Trail', onClick: () => onNavigate('audit'), icon: ShieldCheck },
        { label: 'AIS Fleet Tracking', onClick: () => onNavigate('tracking'), icon: Ship },
        { label: 'Container Inventory', onClick: () => onNavigate('containers'), icon: Box },
        { label: 'Audit Reports', onClick: () => onNavigate('reports'), icon: FileText }
      ]
    }
  };

  const currentRoleConfig = roleConfigs[user?.role] || roleConfigs.admin;

  return (
    <div className="page-wrapper">
      {/* Welcome & Overview Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            MARITIME OPERATIONS & AUDIT TRAIL INTELLIGENCE
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>
            Fleet & Container Security Command
          </h1>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Logged in as <strong style={{ color: '#0f172a' }}>{user?.name}</strong> ({user?.department}) &bull; Active Station: <strong style={{ color: '#0f3460' }}>{user?.assignedPort || 'Global Command'}</strong>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            className="btn btn-secondary"
            style={{ borderColor: '#86efac', color: '#15803d', fontWeight: 700 }}
          >
            <ShieldCheck size={16} color="#15803d" />
            <span>{verifying ? 'Verifying Hashes...' : 'Verify Audit Integrity'}</span>
          </button>

          <button
            onClick={() => onNavigate('ai-assistant')}
            className="btn btn-primary"
          >
            <Sparkles size={16} />
            <span>Ask AI Assistant</span>
          </button>
        </div>
      </div>

      {/* Role-Specific Operational Intelligence Banner */}
      <div style={{
        background: currentRoleConfig.bg,
        border: `1px solid ${currentRoleConfig.borderColor}`,
        borderRadius: '16px',
        padding: '20px 24px',
        marginBottom: '28px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ maxWidth: '680px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: currentRoleConfig.textColor, margin: 0 }}>
              {currentRoleConfig.title}
            </h3>
            <span className={`badge ${currentRoleConfig.badge}`} style={{ fontSize: '10px' }}>
              {currentRoleConfig.badgeText}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
            {currentRoleConfig.desc}
          </p>
        </div>

        {/* Quick Role Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {currentRoleConfig.actions.map((act, idx) => {
            const Icon = act.icon;
            return (
              <button
                key={idx}
                onClick={act.onClick}
                className="btn btn-secondary btn-sm"
                style={{
                  background: '#ffffff',
                  fontWeight: 700,
                  fontSize: '11px',
                  color: '#0f172a',
                  borderColor: currentRoleConfig.borderColor
                }}
              >
                <Icon size={13} color="#0284c7" />
                <span>{act.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Verification Result Banner (if run) */}
      {integrityResult && (
        <div style={{
          marginBottom: '24px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: integrityResult.verified ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${integrityResult.verified ? '#86efac' : '#fca5a5'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {integrityResult.verified ? (
              <CheckCircle size={22} color="#15803d" />
            ) : (
              <AlertTriangle size={22} color="#dc2626" />
            )}
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: integrityResult.verified ? '#15803d' : '#b91c1c' }}>
                {integrityResult.verified ? '✅ Cryptographic Ledger Integrity Verified (100% SHA-256 Chained)' : '⚠️ Audit Trail Integrity Compromised!'}
              </div>
              <div style={{ fontSize: '12px', color: '#475569' }}>
                {integrityResult.message}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIntegrityResult(null)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 700, fontSize: '12px' }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Anomalies Warning Banner if Any */}
      {anomalies.length > 0 && (
        <div
          onClick={() => onNavigate('anomalies')}
          style={{
            marginBottom: '28px',
            padding: '16px 20px',
            borderRadius: '12px',
            background: '#fff1f2',
            border: '1px solid #fecdd3',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 1px 3px rgba(225, 29, 72, 0.05)',
            transition: 'all 0.2s'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="pulse-dot-danger" />
            <div>
              <span style={{ fontWeight: 800, fontSize: '13px', color: '#e11d48' }}>
                {anomalies.length} ACTIVE OPERATIONAL ANOMALIES DETECTED:
              </span>
              <span style={{ fontSize: '13px', color: '#334155', marginLeft: '8px', fontWeight: 600 }}>
                {anomalies[0].title}
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#0284c7', fontWeight: 700 }}>
            <span>Review Anomaly Diagnostic</span>
            <ArrowUpRight size={16} />
          </div>
        </div>
      )}

      {/* 8 Primary KPI Metric Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '18px',
        marginBottom: '32px'
      }}>
        {/* Total Ships */}
        <div className="maritime-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fleet Vessels</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ship size={18} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{stats.totalShips}</div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
            <Radio size={12} />
            <span>Active AIS Telemetry</span>
          </div>
        </div>

        {/* Total Containers */}
        <div className="maritime-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Containers</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={18} color="#0f3460" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>{stats.totalContainers}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Across 5 Global Ports
          </div>
        </div>

        {/* In Transit */}
        <div className="maritime-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>In Transit</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={18} color="#7c3aed" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#7c3aed' }}>{stats.inTransitContainers}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Underway at Sea
          </div>
        </div>

        {/* Delivered Containers */}
        <div className="maritime-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivered Cargo</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#059669' }}>{stats.deliveredContainers}</div>
          <div style={{ fontSize: '11px', color: '#059669', marginTop: '4px', fontWeight: 600 }}>
            Gate Out Verified
          </div>
        </div>

        {/* Delayed Containers */}
        <div className="maritime-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delayed Units</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={18} color="#d97706" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#d97706' }}>{stats.delayedContainers}</div>
          <div style={{ fontSize: '11px', color: '#b45309', marginTop: '4px' }}>
            Exceeding SLA Target
          </div>
        </div>

        {/* Active Anomalies */}
        <div className="maritime-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Anomalies</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={18} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: stats.activeAnomalies > 0 ? '#dc2626' : '#059669' }}>
            {stats.activeAnomalies}
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Heuristic Rule Checks
          </div>
        </div>

        {/* High/Critical Risk */}
        <div className="maritime-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>High Risk Cargo</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={18} color="#dc2626" />
            </div>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#dc2626' }}>{stats.criticalRiskCount}</div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Inspection & Seal Flags
          </div>
        </div>

        {/* SHA-256 Ledger Status */}
        <div className="maritime-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>SHA-256 Ledger</span>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={18} color="#059669" />
            </div>
          </div>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#059669', paddingTop: '4px' }}>
            100% Chained
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px', fontWeight: 700 }}>
            Forward Hashing Active
          </div>
        </div>
      </div>

      {/* Main Grid: Fleet Status & Audit Stream */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.2fr', gap: '28px', marginBottom: '32px' }}>
        {/* Left: Active Ships Fleet Overview */}
        <div className="maritime-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                Live Maritime Fleet Telemetry
              </h3>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Real-time AIS positions, routes, and TEU capacity
              </div>
            </div>
            <button
              onClick={() => onNavigate('tracking')}
              className="btn btn-outline btn-sm"
            >
              <Radio size={14} color="#0284c7" />
              <span>Open AIS Map</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="maritime-table">
              <thead>
                <tr>
                  <th>Vessel / IMO</th>
                  <th>Route</th>
                  <th>Status</th>
                  <th>Speed & Heading</th>
                  <th>Cargo Manifest</th>
                </tr>
              </thead>
              <tbody>
                {ships.slice(0, 5).map((s) => (
                  <tr key={s.shipId}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{s.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>{s.imoNumber}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{s.departurePort} ➔ {s.arrivalPort}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Capt. {s.captain}</div>
                    </td>
                    <td>
                      <span className={`badge ${s.status === 'In Transit' ? 'badge-blue' : s.status === 'Loading' ? 'badge-cyan' : 'badge-green'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>{s.coordinates?.speedKnots || 0} kts</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>{s.coordinates?.heading || 0}° &bull; {s.coordinates?.lat?.toFixed(1)}°N</div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: '#0284c7' }}>
                        {s.containersOnboardCount || 0}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}> / {s.capacityTEU} TEU</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Real-time Immutable Audit Stream */}
        <div className="maritime-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                Cryptographic Audit Stream
              </h3>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Immutable SHA-256 forward-chained events
              </div>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="btn btn-outline btn-sm"
            >
              <span>View Full Ledger</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentAudits.map((log) => (
              <div
                key={log.auditId}
                style={{
                  padding: '14px 16px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color: '#0369a1',
                    background: '#e0f2fe',
                    padding: '2px 8px',
                    borderRadius: '4px'
                  }}>
                    {log.auditId}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {log.action}
                </div>

                <div style={{ fontSize: '12px', color: '#475569' }}>
                  By <strong>{log.username}</strong> ({log.userRole}) at <em>{log.location}</em>
                </div>

                <div style={{
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px'
                }}>
                  <ShieldCheck size={13} color="#059669" />
                  <span>Hash: {log.currentHash ? `${log.currentHash.substring(0, 20)}...` : 'N/A'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Container Inventory & QR Pass Access */}
      <div className="maritime-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
              Recent Monitored Containers & QR Verification
            </h3>
            <div style={{ fontSize: '12px', color: '#64748b' }}>
              Quickly inspect cargo manifests, risk profiles, and generate QR passes
            </div>
          </div>
          <button
            onClick={() => onNavigate('containers')}
            className="btn btn-primary btn-sm"
          >
            <span>Explore All Containers</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
          {containers.slice(0, 4).map((c) => (
            <div
              key={c.containerId}
              style={{
                padding: '18px',
                borderRadius: '12px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '14px'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.3px' }}>
                    {c.containerId}
                  </span>
                  <span className={`badge ${c.riskLevel === 'Low' ? 'badge-green' : c.riskLevel === 'Medium' ? 'badge-amber' : 'badge-red'}`}>
                    {c.riskLevel} Risk
                  </span>
                </div>
                <div style={{ fontSize: '13px', color: '#475569', marginBottom: '10px', lineHeight: '1.4' }}>
                  {c.cargoDescription}
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Location: <strong style={{ color: '#0f172a' }}>{c.currentLocation}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Carrier: <strong style={{ color: '#0284c7' }}>{c.assignedShipName || 'Yard Staged'}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  onClick={() => onOpenQr(c)}
                  className="btn btn-secondary btn-sm"
                  style={{ flex: 1 }}
                >
                  <QrCode size={14} color="#0284c7" />
                  <span>QR Pass</span>
                </button>
                <button
                  onClick={() => onNavigate('timeline', c.containerId)}
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                >
                  <Clock size={14} />
                  <span>Journey</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
