import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  ShieldAlert,
  CheckCircle2,
  Filter,
  Search,
  ArrowRight,
  RotateCcw,
  Check,
  Clock,
  Sparkles
} from 'lucide-react';

export const AnomaliesPage = () => {
  const { hasRole } = useAuth();
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [resolvingId, setResolvingId] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [submittingResolution, setSubmittingResolution] = useState(false);

  useEffect(() => {
    fetchAnomalies();
  }, [statusFilter, severityFilter]);

  const fetchAnomalies = async () => {
    setLoading(true);
    try {
      const data = await api.anomalies.getAll({
        status: statusFilter || undefined,
        severity: severityFilter || undefined
      });
      setAnomalies(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAnomaly = async (anomalyId) => {
    setSubmittingResolution(true);
    try {
      await api.anomalies.resolve(anomalyId, resolutionNotes || 'Investigated and resolved by operations officer.');
      setResolvingId(null);
      setResolutionNotes('');
      await fetchAnomalies();
    } catch (e) {
      alert(`Error resolving anomaly: ${e.message}`);
    } finally {
      setSubmittingResolution(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--danger)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            BEHAVIORAL & HEURISTIC SECURITY MONITORING
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            AI Maritime Anomaly Detection Engine
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Automatic detection of out-of-sequence operations, teleportation jumps, and unverified unloading events
          </div>
        </div>

        {/* Refresh */}
        <button onClick={fetchAnomalies} className="btn btn-secondary">
          <RotateCcw size={14} />
          <span>Refresh Analysis</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="maritime-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ minWidth: '180px' }}>
          <select
            className="select-control"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses (Active & Resolved)</option>
            <option value="Active">Active Anomalies Only</option>
            <option value="Resolved">Resolved Incidents</option>
          </select>
        </div>

        <div style={{ minWidth: '160px' }}>
          <select
            className="select-control"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">All Severities</option>
            <option value="Critical">Critical Severity</option>
            <option value="High">High Severity</option>
            <option value="Medium">Medium Severity</option>
            <option value="Low">Low Severity</option>
          </select>
        </div>
      </div>

      {/* Anomaly Cards List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Running heuristic scan across maritime audit ledger...
        </div>
      ) : anomalies.length === 0 ? (
        <div className="maritime-card" style={{ textAlign: 'center', padding: '60px' }}>
          <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 16px auto' }} />
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            No Security Anomalies Detected
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '450px', margin: '0 auto' }}>
            All container movements, ship arrivals, and inspector sign-offs comply with maritime protocol rules.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {anomalies.map((anm) => (
            <div
              key={anm.anomalyId}
              className="maritime-card"
              style={{
                padding: '24px',
                borderLeft: `4px solid ${
                  anm.severity === 'Critical' ? '#ef4444' :
                  anm.severity === 'High' ? '#ea580c' :
                  anm.severity === 'Medium' ? '#f59e0b' : '#3b82f6'
                }`
              }}
            >
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertTriangle
                    size={20}
                    color={anm.severity === 'Critical' || anm.severity === 'High' ? '#ef4444' : '#f59e0b'}
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                      {anm.title}
                    </h3>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      Incident ID: {anm.anomalyId} &bull; Type: <strong>{anm.type}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className={`badge ${
                    anm.severity === 'Critical' ? 'badge-red' :
                    anm.severity === 'High' ? 'badge-amber' : 'badge-blue'
                  }`}>
                    {anm.severity} Severity
                  </span>
                  <span className={`badge ${anm.status === 'Active' ? 'badge-red' : 'badge-green'}`}>
                    {anm.status}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', marginBottom: '14px', lineHeight: '1.5' }}>
                {anm.description}
              </div>

              {/* Root Cause & Recommended Action Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '14px',
                background: 'var(--bg-secondary)',
                padding: '14px 18px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-color)',
                marginBottom: '16px',
                fontSize: '12px'
              }}>
                <div>
                  <span style={{ color: 'var(--danger)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
                    Root Cause Diagnostic:
                  </span>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '3px' }}>
                    {anm.rootCause}
                  </div>
                </div>

                <div>
                  <span style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
                    Recommended Investigation Action:
                  </span>
                  <div style={{ color: 'var(--text-secondary)', marginTop: '3px' }}>
                    {anm.recommendedAction}
                  </div>
                </div>
              </div>

              {/* Footer Metadata & Resolution */}
              <div style={{
                paddingTop: '12px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '10px',
                fontSize: '11px',
                color: 'var(--text-muted)'
              }}>
                <div>
                  Entity Affected: <strong style={{ color: 'var(--text-primary)' }}>{anm.entityType} ({anm.entityId})</strong> &bull; Detected: {new Date(anm.detectedAt).toLocaleString()}
                  {anm.relatedAuditId && (
                    <span style={{ marginLeft: '6px' }}>&bull; Linked Audit: <code style={{ color: 'var(--cyan)' }}>{anm.relatedAuditId}</code></span>
                  )}
                </div>

                {anm.status === 'Active' && hasRole('admin', 'port_manager', 'ship_manager') && (
                  <div>
                    {resolvingId === anm.anomalyId ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="input-control"
                          style={{ padding: '4px 8px', fontSize: '12px', width: '220px' }}
                          placeholder="Resolution justification notes..."
                          value={resolutionNotes}
                          onChange={(e) => setResolutionNotes(e.target.value)}
                        />
                        <button
                          onClick={() => handleResolveAnomaly(anm.anomalyId)}
                          disabled={submittingResolution}
                          className="btn btn-success btn-sm"
                        >
                          <Check size={12} />
                          <span>Confirm</span>
                        </button>
                        <button onClick={() => setResolvingId(null)} className="btn btn-outline btn-sm">
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setResolvingId(anm.anomalyId)}
                        className="btn btn-secondary btn-sm"
                      >
                        <CheckCircle2 size={13} color="var(--success)" />
                        <span>Resolve Anomaly</span>
                      </button>
                    )}
                  </div>
                )}

                {anm.status === 'Resolved' && (
                  <div style={{ color: '#10b981', fontWeight: 600 }}>
                    Resolved by {anm.resolvedBy || 'Officer'} on {new Date(anm.resolvedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
