import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  Box,
  Ship,
  Activity,
  FileText,
  UserCheck,
  CheckCircle,
  XCircle,
  Radio,
  ArrowUpRight,
  TrendingUp,
  Cpu,
  RefreshCw,
  Sparkles,
  Lock,
  Anchor,
  Layers,
  MapPin,
  Clock,
  ShieldAlert,
  Search,
  Eye,
  Key,
  Database
} from 'lucide-react';

export const AdminDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalShips: 0,
    totalContainers: 0,
    activeAnomalies: 0,
    pendingApprovalsCount: 0,
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    pendingInspections: 0,
    failedInspections: 0,
    totalInspections: 0,
    suspiciousLoginsCount: 0,
    ledgerBlocks: 0,
    ledgerIntegrity: true
  });

  const [pendingUsers, setPendingUsers] = useState([]);
  const [suspiciousAccounts, setSuspiciousAccounts] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [ships, setShips] = useState([]);
  const [containers, setContainers] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);

  // Verification & Tamper Simulation
  const [verifying, setVerifying] = useState(false);
  const [tampering, setTampering] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [integrityResult, setIntegrityResult] = useState(null);
  const [tamperResult, setTamperResult] = useState(null);
  const [actionFeedback, setActionFeedback] = useState(null);

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [
        shipsData,
        containersData,
        inspectionsData,
        auditStats,
        auditLogsData,
        anomaliesData,
        pendingData,
        usersData,
        secStats
      ] = await Promise.all([
        api.ships.getAll().catch(() => []),
        api.containers.getAll().catch(() => []),
        api.inspections ? api.inspections.getAll().catch(() => []) : [],
        api.auditLogs.getStats().catch(() => null),
        api.auditLogs.getAll({ limit: 6 }).catch(() => ({ logs: [] })),
        api.anomalies.getAll({ status: 'Active' }).catch(() => []),
        api.auth.getPendingUsers ? api.auth.getPendingUsers().catch(() => []) : [],
        api.auth.getUsers ? api.auth.getUsers().catch(() => api.auth.getDemoUsers()) : api.auth.getDemoUsers(),
        api.auth.getSecurityStats ? api.auth.getSecurityStats().catch(() => null) : null
      ]);

      const shipsList = Array.isArray(shipsData) ? shipsData : [];
      const contList = Array.isArray(containersData) ? containersData : [];
      const inspList = Array.isArray(inspectionsData) ? inspectionsData : [];
      const allUsers = Array.isArray(usersData) ? usersData : [];
      const pendingList = Array.isArray(pendingData) ? pendingData : [];

      setShips(shipsList);
      setContainers(contList);
      setInspections(inspList);
      setRecentAudits(auditLogsData?.logs || []);
      setAnomalies(Array.isArray(anomaliesData) ? anomaliesData : []);
      setPendingUsers(pendingList);
      setSuspiciousAccounts(secStats?.suspiciousAccounts || allUsers.filter(u => (u.failedLoginAttempts || 0) > 0));

      const pendingInsp = inspList.filter(i => i.result === 'Pending' || i.result === 'Under Review').length +
        contList.filter(c => c.status === 'Under Inspection' || c.status === 'Customs Hold').length;
      const failedInsp = inspList.filter(i => i.result === 'Failed' || i.result === 'Flagged for Quarantine').length +
        contList.filter(c => c.status === 'Flagged' || c.riskLevel === 'High').length;

      setStats({
        totalShips: shipsList.length,
        totalContainers: contList.length,
        activeAnomalies: (anomaliesData || []).length,
        pendingApprovalsCount: secStats?.pendingUsers ?? pendingList.length,
        totalUsers: secStats?.totalUsers ?? allUsers.length,
        activeUsers: secStats?.activeUsers ?? allUsers.filter(u => u.isActive !== false).length,
        inactiveUsers: secStats?.inactiveUsers ?? allUsers.filter(u => u.isActive === false).length,
        pendingInspections: pendingInsp,
        failedInspections: failedInsp,
        totalInspections: inspList.length,
        suspiciousLoginsCount: secStats?.suspiciousAccountsCount ?? allUsers.filter(u => (u.failedLoginAttempts || 0) > 0).length,
        ledgerBlocks: auditStats?.totalLogs || auditLogsData?.total || 12,
        ledgerIntegrity: true
      });
    } catch (e) {
      console.error('Failed to load Admin Dashboard data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    setTamperResult(null);
    try {
      const res = await api.auditLogs.verifyIntegrity();
      setIntegrityResult(res);
      setStats(prev => ({ ...prev, ledgerIntegrity: res.verified }));
    } catch (e) {
      console.error(e);
      setActionFeedback({ type: 'error', text: `Integrity check failed: ${e.message}` });
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    setTampering(true);
    try {
      const res = await api.auditLogs.simulateTamper();
      setTamperResult(res);
      setIntegrityResult(null);
      setActionFeedback({
        type: 'warning',
        text: `Tamper Simulated on record ${res.targetAuditId}! Run "Verify Ledger Integrity" to see cryptographic detection in action.`
      });
    } catch (e) {
      setActionFeedback({ type: 'error', text: `Failed to simulate tamper: ${e.message}` });
    } finally {
      setTampering(false);
    }
  };

  const handleRepairChain = async () => {
    setRepairing(true);
    try {
      const res = await api.auditLogs.repairChain();
      setIntegrityResult(null);
      setTamperResult(null);
      setActionFeedback({
        type: 'success',
        text: `Audit Trail hash continuity successfully restored! All block hashes recomputed.`
      });
      await handleVerifyIntegrity();
    } catch (e) {
      setActionFeedback({ type: 'error', text: `Failed to repair chain: ${e.message}` });
    } finally {
      setRepairing(false);
    }
  };

  const handleApproval = async (userObjOrId, actionOrStatus) => {
    try {
      const targetId = typeof userObjOrId === 'object' ? (userObjOrId.userId || userObjOrId._id) : userObjOrId;
      const normalizedAction = (actionOrStatus || '').toLowerCase().startsWith('app') ? 'approve' : 'reject';
      await api.auth.updateUserApproval(targetId, normalizedAction);
      setActionFeedback({
        type: 'success',
        text: `Officer registration ${normalizedAction === 'approve' ? 'APPROVED & ACTIVATED' : 'REJECTED'}. Immutable audit log created.`
      });
      await loadAdminData();
    } catch (e) {
      setActionFeedback({ type: 'error', text: `Failed to update approval: ${e.message}` });
    }
  };

  return (
    <div className="page-wrapper">
      {/* Top Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            ADMIN CONTROL PANEL
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>
            Admin Dashboard
          </h1>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Manage users, check shipments, review safety alerts, and verify system records
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            className="btn btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <ShieldCheck size={16} color="#0f3460" />
            <span>{verifying ? 'Checking...' : 'Check Record Safety'}</span>
          </button>

          <button
            onClick={handleSimulateTamper}
            disabled={tampering}
            className="btn btn-outline"
            style={{ borderColor: '#fca5a5', color: '#dc2626', fontWeight: 700 }}
          >
            <AlertTriangle size={15} color="#dc2626" />
            <span>{tampering ? 'Testing...' : 'Run Tamper Test'}</span>
          </button>

          <button
            onClick={() => onNavigate('users')}
            className="btn btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <Users size={16} color="#0f3460" />
            <span>Users ({stats.totalUsers})</span>
          </button>

          <button
            onClick={() => onNavigate('ai-assistant')}
            className="btn btn-primary"
          >
            <Sparkles size={16} />
            <span>AI Summary</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionFeedback && (
        <div style={{
          marginBottom: '20px',
          padding: '12px 18px',
          borderRadius: '10px',
          background: actionFeedback.type === 'success' ? '#dcfce7' : actionFeedback.type === 'warning' ? '#fef3c7' : '#fee2e2',
          border: `1px solid ${actionFeedback.type === 'success' ? '#86efac' : actionFeedback.type === 'warning' ? '#fde68a' : '#fecaca'}`,
          color: actionFeedback.type === 'success' ? '#15803d' : actionFeedback.type === 'warning' ? '#b45309' : '#b91c1c',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
        }}>
          <span>{actionFeedback.text}</span>
          <button
            onClick={() => setActionFeedback(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700, fontSize: '16px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* Cryptographic Integrity Result Card */}
      {integrityResult && (
        <div style={{
          marginBottom: '24px',
          padding: '18px 22px',
          borderRadius: '12px',
          background: integrityResult.verified ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${integrityResult.verified ? '#86efac' : '#f87171'}`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {integrityResult.verified ? (
                <CheckCircle size={26} color="#15803d" />
              ) : (
                <AlertTriangle size={26} color="#dc2626" />
              )}
              <div>
                <div style={{ fontWeight: 800, fontSize: '15px', color: integrityResult.verified ? '#15803d' : '#991b1b' }}>
                  {integrityResult.verified ? 'All System Records Are Safe & Unchanged' : 'Warning: Record Change Detected!'}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  {integrityResult.message || `Checked ${integrityResult.totalLogsChecked || stats.ledgerBlocks} records with zero issues.`}
                </div>
                {integrityResult.mismatches && integrityResult.mismatches.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '12px', color: '#b91c1c', background: '#fee2e2', padding: '6px 10px', borderRadius: '6px' }}>
                    <strong>Changed Record Found:</strong> Record ID: {integrityResult.mismatches[0].auditId} has been altered!
                  </div>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {!integrityResult.verified && (
                <button
                  onClick={handleRepairChain}
                  disabled={repairing}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#15803d', borderColor: '#15803d', fontWeight: 700 }}
                >
                  <RefreshCw size={14} className={repairing ? 'spin' : ''} />
                  <span>{repairing ? 'Fixing...' : 'Fix & Restore Records'}</span>
                </button>
              )}
              <button
                onClick={() => setIntegrityResult(null)}
                style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 700 }}
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tamper Simulation Feedback Banner */}
      {tamperResult && (
        <div style={{
          marginBottom: '24px',
          padding: '16px 20px',
          borderRadius: '12px',
          background: '#fffbeb',
          border: '2px dashed #f59e0b',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', color: '#92400e' }}>
              🧪 Tamper Test Started
            </div>
            <div style={{ fontSize: '12px', color: '#78350f', marginTop: '2px' }}>
              Record <code>{tamperResult.targetAuditId}</code> field <code>{tamperResult.alteredField}</code> was modified for testing.
            </div>
          </div>
          <button
            onClick={handleVerifyIntegrity}
            className="btn btn-primary btn-sm"
            style={{ background: '#d97706', borderColor: '#d97706', fontWeight: 700 }}
          >
            <ShieldCheck size={14} />
            <span>Check Record Safety Now</span>
          </button>
        </div>
      )}

      {/* 6 Primary Executive KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '26px'
      }}>
        {/* User Governance */}
        <div className="maritime-card" style={{ padding: '18px', borderLeft: '4px solid #0f3460', cursor: 'pointer' }} onClick={() => onNavigate('users')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Users</span>
            <Users size={18} color="#0f3460" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {stats.totalUsers} <span style={{ fontSize: '12px', fontWeight: 600, color: '#0284c7' }}>({stats.activeUsers} active)</span>
          </div>
          <div style={{ fontSize: '11px', color: stats.inactiveUsers > 0 ? '#b45309' : '#64748b', marginTop: '4px' }}>
            {stats.inactiveUsers > 0 ? `${stats.inactiveUsers} inactive accounts` : 'All accounts active'}
          </div>
        </div>

        {/* Port Cargo & Movements */}
        <div className="maritime-card" style={{ padding: '18px', borderLeft: '4px solid #0284c7', cursor: 'pointer' }} onClick={() => onNavigate('containers')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Containers</span>
            <Box size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {stats.totalContainers} Total
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px' }}>
            Across 5 Ports
          </div>
        </div>

        {/* Ship Voyages & Fleet */}
        <div className="maritime-card" style={{ padding: '18px', borderLeft: '4px solid #0f3460', cursor: 'pointer' }} onClick={() => onNavigate('ships')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Ships & Fleet</span>
            <Ship size={18} color="#0f3460" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {stats.totalShips} Ships
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px' }}>
            Live Location Active
          </div>
        </div>

        {/* Inspections Status (Pending vs Failed) */}
        <div className="maritime-card" style={{ padding: '18px', borderLeft: '4px solid #0284c7', cursor: 'pointer' }} onClick={() => onNavigate('inspections')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Inspections</span>
            <Activity size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {stats.pendingInspections} <span style={{ fontSize: '13px', fontWeight: 700, color: stats.failedInspections > 0 ? '#dc2626' : '#64748b' }}>({stats.failedInspections} issues)</span>
          </div>
          <div style={{ fontSize: '11px', color: stats.failedInspections > 0 ? '#dc2626' : '#0284c7', marginTop: '4px' }}>
            {stats.failedInspections > 0 ? 'Needs Review' : 'All Clear'}
          </div>
        </div>

        {/* Security & Access Incidents */}
        <div className="maritime-card" style={{ padding: '18px', borderLeft: '4px solid #0f3460' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Security Alerts</span>
            <ShieldAlert size={18} color="#0f3460" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {stats.suspiciousLoginsCount + stats.activeAnomalies} Alerts
          </div>
          <div style={{ fontSize: '11px', color: stats.suspiciousLoginsCount > 0 ? '#dc2626' : '#0284c7', marginTop: '4px' }}>
            {stats.suspiciousLoginsCount > 0 ? `${stats.suspiciousLoginsCount} failed login attempts` : 'Zero Security Issues'}
          </div>
        </div>

        {/* Cryptographic Ledger Blocks */}
        <div className="maritime-card" style={{ padding: '18px', borderLeft: '4px solid #0284c7', cursor: 'pointer' }} onClick={() => onNavigate('audit')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Activity History</span>
            <ShieldCheck size={18} color="#0284c7" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {stats.ledgerBlocks} Logs
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Lock size={10} /> Verified & Protected
          </div>
        </div>
      </div>

      {/* Pending Officer Registration Approvals Module */}
      {pendingUsers.length > 0 && (
        <div className="maritime-card" style={{ padding: '24px', marginBottom: '28px', border: '2px solid #fde68a', background: '#fffbeb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={20} color="#d97706" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#92400e' }}>
                  Pending User Approvals ({pendingUsers.length})
                </h3>
                <div style={{ fontSize: '12px', color: '#b45309' }}>
                  New team accounts need admin approval before they can log in
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('users')}
              className="btn btn-outline btn-sm"
              style={{ borderColor: '#d97706', color: '#92400e', fontWeight: 700 }}
            >
              <span>View All Users</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #fef3c7' }}>
            <table className="maritime-table">
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Email</th>
                  <th>Requested Role</th>
                  <th>Port / Location</th>
                  <th>Department</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((pu) => (
                  <tr key={pu._id || pu.userId}>
                    <td><strong>{pu.name}</strong></td>
                    <td><code style={{ color: '#0284c7' }}>{pu.email}</code></td>
                    <td>
                      <span className={`badge ${
                        pu.role === 'port_manager' ? 'badge-cyan' :
                        pu.role === 'ship_manager' ? 'badge-blue' :
                        pu.role === 'inspector' ? 'badge-amber' : 'badge-purple'
                      }`}>
                        {pu.role?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>{pu.assignedPort || 'Mumbai Port'}</td>
                    <td>{pu.department || 'Operations'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApproval(pu.userId || pu._id, 'approve')}
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: '#86efac', color: '#15803d', fontWeight: 700, background: '#f0fdf4' }}
                        >
                          <CheckCircle size={14} color="#15803d" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleApproval(pu.userId || pu._id, 'reject')}
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: '#fca5a5', color: '#dc2626', fontWeight: 700, background: '#fef2f2' }}
                        >
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Suspicious Security Activities / Failed Logins */}
      {suspiciousAccounts.length > 0 && (
        <div className="maritime-card" style={{ padding: '20px', marginBottom: '26px', border: '1px solid #fecaca', background: '#fff5f5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <AlertTriangle size={20} color="#dc2626" />
            <div>
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#991b1b' }}>
                Security Alerts: Failed Login Attempts
              </h3>
              <div style={{ fontSize: '12px', color: '#b91c1c' }}>
                Accounts with repeated failed login attempts
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #fee2e2' }}>
            <table className="maritime-table">
              <thead>
                <tr>
                  <th>Account</th>
                  <th>Email</th>
                  <th>Failed Attempts</th>
                  <th>Last IP</th>
                  <th>Last Attempt</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {suspiciousAccounts.map((sa) => (
                  <tr key={sa.userId || sa._id}>
                    <td><strong>{sa.name}</strong> ({sa.role})</td>
                    <td><code>{sa.email}</code></td>
                    <td><span className="badge badge-red">{sa.failedLoginAttempts} Failed</span></td>
                    <td><code>{sa.lastFailedIp || '127.0.0.1'}</code></td>
                    <td>{sa.lastFailedLogin ? new Date(sa.lastFailedLogin).toLocaleString() : 'Recent'}</td>
                    <td>
                      <button
                        onClick={() => onNavigate('users')}
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                      >
                        Reset Password
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dual Grid: Audit Stream & Security Rules */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '24px', marginBottom: '28px' }}>
        {/* Left: Cryptographic Audit Stream */}
        <div className="maritime-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Recent Activity
              </h3>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Recent actions logged across all ports and ships
              </div>
            </div>
            <button onClick={() => onNavigate('audit')} className="btn btn-outline btn-sm">
              <span>View All</span>
              <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentAudits.slice(0, 5).map((log) => (
              <div
                key={log.auditId}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 800, color: '#0369a1', fontFamily: 'monospace' }}>{log.auditId}</span>
                  <span style={{ color: '#64748b', fontSize: '11px' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{log.action}</div>
                <div style={{ color: '#64748b', fontSize: '11px', marginTop: '3px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <span>By <strong>{log.username}</strong> ({log.userRole}) at <em>{log.location}</em></span>
                  <span style={{ fontFamily: 'monospace', color: '#94a3b8' }}>IP: {log.ipAddress || '127.0.0.1'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Security Governance & Restrictions */}
        <div className="maritime-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              System Safety Rules
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px', color: '#334155' }}>
              <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <strong>🔒 Permanent History:</strong>
                <div style={{ color: '#64748b', marginTop: '2px' }}>
                  Records cannot be deleted or secretly edited. Every action creates a permanent, verified log entry.
                </div>
              </div>

              <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <strong>🛡️ Account Protection:</strong>
                <div style={{ color: '#64748b', marginTop: '2px' }}>
                  Accounts are flagged for safety after 3 failed login attempts. Password resets are tracked.
                </div>
              </div>

              <div style={{ padding: '10px', borderRadius: '8px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <strong>📜 Long-Term Record Keeping:</strong>
                <div style={{ color: '#64748b', marginTop: '2px' }}>
                  Container checks, safety inspections, and shipping documents are safely stored for compliance.
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={() => onNavigate('reports')}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <FileText size={14} />
              <span>View Reports</span>
            </button>
            <button
              onClick={() => onNavigate('anomalies')}
              className="btn btn-secondary btn-sm"
              style={{ flex: 1, justifyContent: 'center' }}
            >
              <AlertTriangle size={14} />
              <span>Issues ({stats.activeAnomalies})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
