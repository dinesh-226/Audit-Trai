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
  Lock
} from 'lucide-react';

export const AuditLogsPage = ({ onOpenTamperModal }) => {
  const { hasRole } = useAuth();
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Filters
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // Integrity Check State
  const [verifying, setVerifying] = useState(false);
  const [integrityReport, setIntegrityReport] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter, entityFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = {
        limit: pageSize,
        skip: page * pageSize
      };
      if (search && search.trim()) params.search = search.trim();
      if (actionFilter) params.action = actionFilter;
      if (entityFilter) params.entityType = entityFilter;
      if (userFilter) params.userId = userFilter;

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
    setEntityFilter('');
    setUserFilter('');
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
            IMMUTABLE CRYPTOGRAPHIC LEDGER
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Tamper-Resistant Audit Trail & Hash Chain
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Every operation is cryptographically signed with SHA-256 forward-chained blocks
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {hasRole('admin') && (
            <button
              onClick={onOpenTamperModal}
              className="btn btn-secondary"
              style={{ borderColor: 'rgba(239, 68, 68, 0.4)', color: '#f87171' }}
            >
              <Bug size={16} />
              <span>Simulate Tamper</span>
            </button>
          )}

          <button
            onClick={handleVerifyIntegrity}
            disabled={verifying}
            className="btn btn-primary"
            style={{ background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)' }}
          >
            <ShieldCheck size={16} />
            <span>{verifying ? 'Scanning Blockchain...' : 'Verify Audit Integrity'}</span>
          </button>

          <button onClick={handleExportCsv} className="btn btn-secondary">
            <Download size={16} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Verification Results Panel (if triggered) */}
      {integrityReport && (
        <div style={{
          marginBottom: '28px',
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          background: integrityReport.verified ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.12)',
          border: `1px solid ${integrityReport.verified ? '#10b981' : '#ef4444'}`,
          animation: 'fadeIn 0.3s ease'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {integrityReport.verified ? (
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheck size={24} color="#10b981" />
                </div>
              ) : (
                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldAlert size={24} color="#ef4444" />
                </div>
              )}
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: integrityReport.verified ? '#10b981' : '#f87171' }}>
                  {integrityReport.verified ? '✅ Audit Trail Integrity Verified (100% Valid)' : '⚠️ CRITICAL: Blockchain Integrity Compromised!'}
                </h3>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {integrityReport.message}
                </div>
              </div>
            </div>

            <button onClick={() => setIntegrityReport(null)} className="btn btn-outline btn-sm">
              Close Report
            </button>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            background: 'var(--bg-secondary)',
            padding: '14px',
            borderRadius: 'var(--radius-md)',
            fontSize: '12px'
          }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Total Audited Blocks</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#f8fafc' }}>{integrityReport.totalRecords}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Verified Clean Blocks</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#10b981' }}>{integrityReport.verifiedCount}</div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Security Status</span>
              <div style={{ fontSize: '16px', fontWeight: 800, color: integrityReport.verified ? '#10b981' : '#ef4444' }}>
                {integrityReport.status}
              </div>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Chain Head SHA-256</span>
              <div style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--cyan)' }}>
                {integrityReport.latestHash ? `${integrityReport.latestHash.substring(0, 16)}...` : 'N/A'}
              </div>
            </div>
          </div>

          {integrityReport.compromisedRecord && (
            <div style={{ marginTop: '16px', padding: '14px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '8px', fontSize: '12px' }}>
              <div style={{ fontWeight: 700, color: '#f87171', marginBottom: '4px' }}>
                Compromised Block Details:
              </div>
              <div>Audit ID: <strong>{integrityReport.compromisedRecord.auditId}</strong> (Block #{integrityReport.compromisedRecord.sequenceNumber})</div>
              <div>Action: {integrityReport.compromisedRecord.action} on {integrityReport.compromisedRecord.entityId}</div>
              <div>Timestamp: {new Date(integrityReport.compromisedRecord.timestamp).toLocaleString()}</div>
            </div>
          )}
        </div>
      )}

      {/* Advanced Filter Bar */}
      <div className="maritime-card" style={{ padding: '18px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Search by Audit ID (AT-2026...), container (ONEU-8821094), ship, user, port..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '170px' }}>
            <select
              className="select-control"
              value={actionFilter}
              onChange={(e) => {
                setActionFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="">All Action Types</option>
              <option value="CONTAINER_BOOKED">CONTAINER_BOOKED</option>
              <option value="CONTAINER_LOADED_ON_SHIP">CONTAINER_LOADED_ON_SHIP</option>
              <option value="CONTAINER_STATUS_CHANGED">CONTAINER_STATUS_CHANGED</option>
              <option value="CARGO_UNLOADED">CARGO_UNLOADED</option>
              <option value="CONTAINER_INSPECTION_COMPLETED">INSPECTION_COMPLETED</option>
              <option value="CONTAINER_DELIVERED">CONTAINER_DELIVERED</option>
              <option value="SHIP_VOYAGE_DEPARTED">SHIP_VOYAGE_DEPARTED</option>
              <option value="EVIDENCE_ATTACHED">EVIDENCE_ATTACHED</option>
              <option value="ANOMALY_TRIGGERED">ANOMALY_TRIGGERED</option>
              <option value="USER_LOGIN">USER_LOGIN</option>
            </select>
          </div>

          <div style={{ minWidth: '140px' }}>
            <select
              className="select-control"
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

          <button type="submit" className="btn btn-secondary">
            <Search size={14} />
            <span>Search</span>
          </button>

          {(search || actionFilter || entityFilter || userFilter) && (
            <button type="button" onClick={handleResetFilters} className="btn btn-outline" style={{ fontSize: '12px' }}>
              Reset Filters
            </button>
          )}
        </form>
      </div>

      {/* Ledger Table */}
      <div className="maritime-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Verifying and retrieving cryptographic audit stream...
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
                  <th>Timestamp (UTC)</th>
                  <th>Operator</th>
                  <th>Action</th>
                  <th>Entity Affected</th>
                  <th>Port / Location</th>
                  <th>Cryptographic SHA-256 Block</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.auditId} style={{ background: log.isTampered ? 'rgba(239, 68, 68, 0.1)' : 'transparent' }}>
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
                        {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
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
                      <span className="badge badge-blue" style={{ fontSize: '11px' }}>
                        {log.action}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {log.entityType}: <code style={{ color: '#38bdf8' }}>{log.entityId}</code>
                      </div>
                      {log.containerId && (
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Box: <strong>{log.containerId}</strong> {log.shipId ? `&bull; Ship: ${log.shipId}` : ''}
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {log.location}
                      </div>
                    </td>

                    <td>
                      <div
                        className="hash-pill"
                        onClick={() => handleCopyHash(log.currentHash)}
                        title="Click to copy full SHA-256 hash"
                      >
                        <Lock size={12} color="#10b981" />
                        <span>{log.currentHash ? `${log.currentHash.substring(0, 12)}...` : 'GENESIS'}</span>
                        {copiedHash === log.currentHash && (
                          <span style={{ color: '#10b981', fontSize: '10px' }}>✓</span>
                        )}
                      </div>
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
    </div>
  );
};
