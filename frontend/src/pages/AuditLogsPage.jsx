import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Download,
  FileText,
  RotateCcw,
  Bug,
  CheckCircle,
  AlertTriangle,
  Copy,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Lock,
  RefreshCw,
  Eye,
  Calendar,
  Globe,
  SlidersHorizontal,
  X
} from 'lucide-react';

export const AuditLogsPage = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Integrity Check & Tamper State
  const [verifying, setVerifying] = useState(false);
  const [tampering, setTampering] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [integrityReport, setIntegrityReport] = useState(null);
  const [tamperBanner, setTamperBanner] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  // Detail Modal
  const [selectedLog, setSelectedLog] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, roleFilter, entityFilter, startDate, endDate]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        limit: pageSize,
        skip: page * pageSize
      };
      if (search && search.trim()) params.search = search.trim();
      if (actionFilter) params.action = actionFilter;
      if (roleFilter) params.userRole = roleFilter;
      if (entityFilter) params.entityType = entityFilter;
      if (ipFilter && ipFilter.trim()) params.ipAddress = ipFilter.trim();
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const data = await api.auditLogs.getAll(params);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    fetchLogs();
  };

  const handleResetFilters = () => {
    setSearch('');
    setActionFilter('');
    setRoleFilter('');
    setEntityFilter('');
    setIpFilter('');
    setStartDate('');
    setEndDate('');
    setPage(0);
  };

  const handleVerifyIntegrity = async () => {
    setVerifying(true);
    setIntegrityReport(null);
    try {
      const res = await api.auditLogs.verifyIntegrity();
      setIntegrityReport(res);
    } catch (e) {
      alert(`Integrity verification failed: ${e.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleSimulateTamper = async () => {
    setTampering(true);
    setIntegrityReport(null);
    try {
      const res = await api.auditLogs.simulateTamper();
      setTamperBanner(res);
      await fetchLogs();
    } catch (e) {
      alert(`Tamper simulation failed: ${e.message}`);
    } finally {
      setTampering(false);
    }
  };

  const handleRepairChain = async () => {
    setRepairing(true);
    try {
      const res = await api.auditLogs.repairChain();
      setTamperBanner(null);
      setIntegrityReport(null);
      await fetchLogs();
      await handleVerifyIntegrity();
    } catch (e) {
      alert(`Chain repair failed: ${e.message}`);
    } finally {
      setRepairing(false);
    }
  };

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const handleExportCsv = () => {
    window.open(api.reports.getCsvExportUrl(), '_blank');
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            ACTIVITY HISTORY
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Activity History & Audit Logs
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Protected record of all actions across containers, ships, users, and system settings
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)', fontWeight: 700 }}
          >
            <ShieldCheck size={16} />
            <span>{verifying ? 'Checking...' : 'Check Record Safety'}</span>
          </button>

          {isAdmin && (
            <button
              onClick={handleSimulateTamper}
              disabled={tampering}
              className="btn btn-outline"
              style={{ borderColor: '#fca5a5', color: '#dc2626', fontWeight: 700 }}
            >
              <Bug size={15} />
              <span>{tampering ? 'Testing...' : 'Test Tamper'}</span>
            </button>
          )}

          <button onClick={handleExportCsv} className="btn btn-secondary">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Tamper Simulation Banner */}
      {tamperBanner && (
        <div style={{
          marginBottom: '20px',
          padding: '16px 20px',
          borderRadius: '10px',
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
              🧪 Tamper Simulation Injected on Audit ID: <code>{tamperBanner.targetAuditId}</code>
            </div>
            <div style={{ fontSize: '12px', color: '#78350f', marginTop: '2px' }}>
              Field <code>{tamperBanner.alteredField}</code> set to <code>"{tamperBanner.fakeValue}"</code>. Click "Verify Audit Integrity" to test tamper detection!
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handleVerifyIntegrity}
              className="btn btn-primary btn-sm"
              style={{ background: '#d97706', borderColor: '#d97706' }}
            >
              <ShieldCheck size={14} />
              <span>Verify Integrity Now</span>
            </button>
            <button
              onClick={handleRepairChain}
              disabled={repairing}
              className="btn btn-secondary btn-sm"
            >
              <RefreshCw size={14} className={repairing ? 'spin' : ''} />
              <span>Repair Chain</span>
            </button>
          </div>
        </div>
      )}

      {/* Verification Results Panel (if triggered) */}
      {integrityReport && (
        <div style={{
          marginBottom: '24px',
          padding: '20px',
          borderRadius: 'var(--radius-lg)',
          background: integrityReport.verified ? '#f0fdf4' : '#fef2f2',
          border: `2px solid ${integrityReport.verified ? '#86efac' : '#f87171'}`,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {integrityReport.verified ? (
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={24} color="#15803d" />
                </div>
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={24} color="#dc2626" />
                </div>
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: integrityReport.verified ? '#15803d' : '#991b1b' }}>
                  {integrityReport.verified ? '✅ Cryptographic Ledger 100% Valid & Untampered' : '⚠️ TAMPER ALERT: Hash Continuity Mismatch Detected!'}
                </h3>
                <div style={{ fontSize: '13px', color: '#475569', marginTop: '2px' }}>
                  {integrityReport.message || `${integrityReport.totalLogsChecked || total} sequential SHA-256 hash proofs verified successfully.`}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {!integrityReport.verified && isAdmin && (
                <button
                  onClick={handleRepairChain}
                  disabled={repairing}
                  className="btn btn-primary btn-sm"
                  style={{ background: '#15803d', borderColor: '#15803d' }}
                >
                  <RefreshCw size={14} className={repairing ? 'spin' : ''} />
                  <span>{repairing ? 'Repairing...' : 'Repair Hash Chain'}</span>
                </button>
              )}
              <button onClick={() => setIntegrityReport(null)} className="btn btn-outline btn-sm">
                Dismiss
              </button>
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '12px',
            background: '#ffffff',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '12px',
            border: '1px solid #e2e8f0'
          }}>
            <div>
              <span style={{ color: '#64748b' }}>Total Audited Records</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>{integrityReport.totalLogsChecked || total}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Clean Proofs</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#15803d' }}>{integrityReport.validCount || total}</div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Chain Security</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: integrityReport.verified ? '#15803d' : '#dc2626' }}>
                {integrityReport.verified ? 'VERIFIED' : 'TAMPER DETECTED'}
              </div>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>Latest SHA-256 Seal</span>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: '#0284c7' }}>
                {integrityReport.latestHash ? `${integrityReport.latestHash.substring(0, 14)}...` : 'AUTHENTICATED'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Filter Bar */}
      <div className="maritime-card" style={{ padding: '18px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', marginBottom: showAdvancedFilters ? '14px' : '0' }}>
            <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                className="input-control"
                style={{ paddingLeft: '32px', width: '100%' }}
                placeholder="Search by Audit ID (AT-...), Container, Ship, User, IP address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <select
              className="select-control"
              style={{ width: 'auto', minWidth: '160px' }}
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Action Types</option>
              <option value="USER_CREATED_BY_ADMIN">USER_CREATED_BY_ADMIN</option>
              <option value="USER_ACCOUNT_ACTIVATED">USER_ACCOUNT_ACTIVATED</option>
              <option value="USER_ACCOUNT_DEACTIVATED">USER_ACCOUNT_DEACTIVATED</option>
              <option value="USER_ROLE_MODIFIED">USER_ROLE_MODIFIED</option>
              <option value="USER_PASSWORD_RESET_BY_ADMIN">USER_PASSWORD_RESET_BY_ADMIN</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
              <option value="USER_LOGIN_FAILED">USER_LOGIN_FAILED</option>
              <option value="CONTAINER_BOOKED">CONTAINER_BOOKED</option>
              <option value="CONTAINER_LOADED_ON_SHIP">CONTAINER_LOADED_ON_SHIP</option>
              <option value="CONTAINER_INSPECTION_COMPLETED">INSPECTION_COMPLETED</option>
              <option value="CONTAINER_STATUS_CHANGED">CONTAINER_STATUS_CHANGED</option>
              <option value="CARGO_UNLOADED">CARGO_UNLOADED</option>
              <option value="SHIP_VOYAGE_DEPARTED">SHIP_VOYAGE_DEPARTED</option>
              <option value="EVIDENCE_ATTACHED">EVIDENCE_ATTACHED</option>
              <option value="ANOMALY_TRIGGERED">ANOMALY_TRIGGERED</option>
            </select>

            <select
              className="select-control"
              style={{ width: 'auto', minWidth: '130px' }}
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Roles</option>
              <option value="admin">Admin</option>
              <option value="port_manager">Port Manager</option>
              <option value="ship_manager">Ship Manager</option>
              <option value="inspector">Inspector</option>
              <option value="viewer">Viewer</option>
            </select>

            <button type="submit" className="btn btn-secondary">
              <Search size={14} />
              <span>Search</span>
            </button>

            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="btn btn-outline"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <SlidersHorizontal size={14} />
              <span>{showAdvancedFilters ? 'Fewer Filters' : 'Date & IP Filters'}</span>
            </button>

            {(search || actionFilter || roleFilter || entityFilter || ipFilter || startDate || endDate) && (
              <button type="button" onClick={handleResetFilters} className="btn btn-outline" style={{ fontSize: '12px' }}>
                Reset
              </button>
            )}
          </div>

          {/* Advanced Filters Row */}
          {showAdvancedFilters && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              paddingTop: '12px',
              borderTop: '1px solid #e2e8f0',
              marginTop: '12px'
            }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Entity Type
                </label>
                <select
                  className="select-control"
                  style={{ width: '100%' }}
                  value={entityFilter}
                  onChange={(e) => {
                    setEntityFilter(e.target.value);
                    setPage(0);
                  }}
                >
                  <option value="">All Entities</option>
                  <option value="Container">Container</option>
                  <option value="Ship">Ship</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Evidence">Evidence</option>
                  <option value="User">User</option>
                  <option value="System">System</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  IP Address Filter
                </label>
                <input
                  type="text"
                  placeholder="e.g. 127.0.0.1"
                  className="input-control"
                  style={{ width: '100%' }}
                  value={ipFilter}
                  onChange={(e) => setIpFilter(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Start Date
                </label>
                <input
                  type="date"
                  className="input-control"
                  style={{ width: '100%' }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  End Date
                </label>
                <input
                  type="date"
                  className="input-control"
                  style={{ width: '100%' }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Ledger Table */}
      <div className="maritime-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '10px', color: 'var(--cyan)' }} />
            <div>Verifying and retrieving cryptographic audit stream...</div>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            No audit records found matching search filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="maritime-table">
              <thead>
                <tr>
                  <th>Block # / Audit ID</th>
                  <th>Timestamp</th>
                  <th>Operator & Role</th>
                  <th>Action</th>
                  <th>Target Entity</th>
                  <th>IP & Port</th>
                  <th>SHA-256 Proof</th>
                  <th style={{ textAlign: 'center' }}>Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.auditId} style={{ background: log.isTampered ? '#fef2f2' : 'transparent' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>#{log.sequenceNumber}</span>
                        <span style={{
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          fontSize: '12px',
                          color: log.isTampered ? '#ef4444' : 'var(--cyan)'
                        }}>
                          {log.auditId}
                        </span>
                      </div>
                      {log.isTampered && (
                        <span className="badge badge-red" style={{ fontSize: '9px', marginTop: '2px' }}>
                          TAMPER DETECTED
                        </span>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '13px' }}>
                        {log.username || log.userId}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Role: <strong style={{ color: 'var(--cyan)' }}>{log.userRole}</strong>
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${
                        log.action.includes('FAILED') || log.action.includes('DEACTIVATED') || log.action.includes('DELETED') ? 'badge-red' :
                        log.action.includes('USER_CREATED') || log.action.includes('APPROVED') || log.action.includes('ACTIVATED') ? 'badge-green' :
                        log.action.includes('INSPECTION') ? 'badge-amber' :
                        log.action.includes('SHIP') ? 'badge-blue' : 'badge-cyan'
                      }`} style={{ fontSize: '11px' }}>
                        {log.action}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.entityType}: <code style={{ color: '#0284c7' }}>{log.entityId}</code>
                      </div>
                      {log.containerId && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Box: <strong>{log.containerId}</strong> {log.shipId ? `&bull; Ship: ${log.shipId}` : ''}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: '12px', color: '#0f172a' }}>{log.location}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>IP: {log.ipAddress || '127.0.0.1'}</div>
                    </td>

                    <td>
                      <div
                        className="hash-pill"
                        onClick={() => handleCopyHash(log.currentHash)}
                        title="Click to copy full SHA-256 hash"
                        style={{ cursor: 'pointer' }}
                      >
                        <Lock size={11} color="#10b981" />
                        <span>{log.currentHash ? `${log.currentHash.substring(0, 10)}...` : 'GENESIS'}</span>
                        {copiedHash === log.currentHash && (
                          <span style={{ color: '#10b981', fontSize: '10px' }}>✓</span>
                        )}
                      </div>
                    </td>

                    <td style={{ textAlign: 'center' }}>
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--text-muted)'
        }}>
          <div>
            Showing <strong>{logs.length}</strong> of <strong>{total}</strong> chained records
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              disabled={page === 0}
              className="btn btn-secondary btn-sm"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>
            <button
              onClick={() => setPage(prev => prev + 1)}
              disabled={(page + 1) * pageSize >= total}
              className="btn btn-secondary btn-sm"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="maritime-card" style={{ width: '100%', maxWidth: '640px', padding: '24px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Cryptographic Audit Record #{selectedLog.sequenceNumber}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Audit ID: {selectedLog.auditId}</div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <div><strong>Action:</strong> <span style={{ color: '#0284c7' }}>{selectedLog.action}</span></div>
                <div><strong>Timestamp:</strong> {new Date(selectedLog.timestamp).toLocaleString()}</div>
                <div><strong>Operator:</strong> {selectedLog.username} ({selectedLog.userRole})</div>
                <div><strong>User ID:</strong> <code>{selectedLog.userId}</code></div>
                <div><strong>Location / Port:</strong> {selectedLog.location}</div>
                <div><strong>IP Address:</strong> <code>{selectedLog.ipAddress || '127.0.0.1'}</code></div>
                <div><strong>Entity Type:</strong> {selectedLog.entityType}</div>
                <div><strong>Entity ID:</strong> <code>{selectedLog.entityId}</code></div>
              </div>

              {selectedLog.containerId && (
                <div style={{ background: '#f0f9ff', padding: '10px 12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                  <strong>Linked Container:</strong> <code>{selectedLog.containerId}</code>
                  {selectedLog.shipId && <span> &bull; <strong>Linked Vessel:</strong> <code>{selectedLog.shipId}</code></span>}
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <div style={{ fontWeight: 700, marginBottom: '4px', color: '#334155' }}>Recorded Event Payload / Delta:</div>
                  <pre style={{ background: '#0f172a', color: '#38bdf8', padding: '12px', borderRadius: '8px', fontSize: '11px', overflowX: 'auto' }}>
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontWeight: 700, marginBottom: '6px', color: '#334155' }}>Cryptographic SHA-256 Proofs:</div>
                <div style={{ marginBottom: '6px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Previous Block Hash (Chained):</div>
                  <code style={{ fontSize: '11px', color: '#475569', wordBreak: 'break-all' }}>{selectedLog.previousHash}</code>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Current Block Hash (Payload Signed):</div>
                  <code style={{ fontSize: '11px', color: '#15803d', wordBreak: 'break-all', fontWeight: 700 }}>{selectedLog.currentHash}</code>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '18px' }}>
              <button onClick={() => setSelectedLog(null)} className="btn btn-secondary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
