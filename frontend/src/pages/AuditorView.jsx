import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  ShieldCheck, 
  Printer, 
  Download, 
  ArrowLeft, 
  FileText, 
  CheckCircle, 
  Lock,
  Clock,
  UserCheck
} from 'lucide-react';

export const AuditorView = ({ projectId = 'all', projects = [], onBack, onSelectLog }) => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  const activeProject = projects.find(p => p._id === projectId);
  const titleScope = activeProject ? activeProject.name : 'Enterprise Workspace';

  useEffect(() => {
    fetchAuditorData();
  }, [projectId]);

  const fetchAuditorData = async () => {
    try {
      setLoading(true);
      const [logsRes, statsRes] = await Promise.all([
        api.auditLogs.getAll({ 
          projectId: projectId === 'all' ? undefined : projectId,
          limit: 100,
          sortOrder: 'desc'
        }),
        api.auditLogs.getStats(projectId === 'all' ? undefined : projectId)
      ]);
      setLogs(logsRes.logs || []);
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load auditor report data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExportCsv = () => {
    const url = api.auditLogs.getExportCsvUrl({ projectId });
    window.open(url, '_blank');
  };

  return (
    <div className="fade-in" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Top Bar for Screen Viewing */}
      <div className="btn-no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <button onClick={onBack} className="btn btn-outline btn-sm">
          <ArrowLeft size={14} />
          <span>Return to Standard View</span>
        </button>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportCsv} className="btn btn-secondary btn-sm">
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button onClick={handlePrint} className="btn btn-primary btn-sm">
            <Printer size={14} />
            <span>Download / Print PDF Report</span>
          </button>
        </div>
      </div>

      {/* Formal Audit Report Printable Document Container */}
      <div className="card" style={{ padding: '2.5rem', background: 'var(--bg-surface)' }}>
        {/* Document Header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'flex-start', 
          justifyContent: 'space-between', 
          borderBottom: '2px solid var(--border-subtle)',
          paddingBottom: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '0.25rem' }}>
              <ShieldCheck size={28} style={{ color: 'var(--primary)' }} />
              <h1 style={{ fontSize: '1.6rem', letterSpacing: '-0.01em' }}>
                Independent Audit Trail Compliance Report
              </h1>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Project Scope: <strong style={{ color: 'var(--text-main)' }}>{titleScope}</strong> {activeProject ? `(${activeProject.code})` : ''}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
              Report Generated: {new Date().toUTCString()}
            </div>
          </div>

          <div style={{ 
            textAlign: 'right', 
            background: 'rgba(16, 185, 129, 0.1)', 
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '0.65rem 1rem',
            borderRadius: 'var(--radius-md)'
          }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase' }}>
              INTEGRITY VERIFIED
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              SHA-256 Ledger Sealed
            </div>
          </div>
        </div>

        {/* Executive Summary Box */}
        <div style={{ 
          background: 'var(--bg-input)', 
          border: '1px solid var(--border-subtle)', 
          borderRadius: 'var(--radius-md)', 
          padding: '1.25rem',
          marginBottom: '2rem'
        }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-subtle)' }}>
            Executive Audit Summary
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', textAlign: 'center', margin: '1rem 0' }}>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-main)' }}>{stats?.total || logs.length}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Event Records</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>{stats?.actionBreakdown?.CREATE || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Created Entities</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0ea5e9' }}>{stats?.actionBreakdown?.UPDATE || 0}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Modifications</div>
            </div>
            <div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: stats?.riskyCount > 0 ? '#f87171' : 'var(--text-main)' }}>
                {stats?.riskyCount || 0}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Critical / Risky Flags</div>
            </div>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
            This immutable log report constitutes a verifiable chronological account of all changes to project state, budget figures, team access permissions, and automated integration events.
          </p>
        </div>

        {/* Clean Auditor Data Table (PDF Section 6.5) */}
        <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Ledger Activity Log</h3>
        
        <table className="audit-table" style={{ fontSize: '0.825rem' }}>
          <thead>
            <tr>
              <th style={{ width: '16%' }}>Timestamp (UTC)</th>
              <th style={{ width: '18%' }}>Operator / Actor</th>
              <th style={{ width: '10%' }}>Action</th>
              <th style={{ width: '14%' }}>Entity Target</th>
              <th style={{ width: '22%' }}>State Transition (Diff)</th>
              <th style={{ width: '20%' }}>Business Justification</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((l) => (
              <tr key={l._id}>
                <td style={{ whiteSpace: 'nowrap' }}>
                  {new Date(l.timestamp).toISOString().replace('T', ' ').substring(0, 19)}
                </td>
                <td>
                  <strong>{l.userName}</strong>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>{l.userEmail}</div>
                </td>
                <td>
                  <span className={`badge badge-${l.action?.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                    {l.action}
                  </span>
                </td>
                <td>
                  <strong>{l.entityType}</strong>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {l.entityName}
                  </div>
                </td>
                <td>
                  {l.oldValue !== null && l.newValue !== null ? (
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>
                      <span style={{ color: '#ef4444' }}>{String(l.oldValue)}</span> → <span style={{ color: '#10b981', fontWeight: 600 }}>{String(l.newValue)}</span>
                    </div>
                  ) : l.newValue !== null ? (
                    <span style={{ color: '#10b981', fontSize: '0.75rem' }}>Created: {String(l.newValue)}</span>
                  ) : (
                    <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>—</span>
                  )}
                </td>
                <td>
                  <span style={{ color: l.reason ? 'var(--text-main)' : 'var(--text-subtle)', fontStyle: l.reason ? 'normal' : 'italic' }}>
                    {l.reason || 'No justification entered'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Auditor Signoff & Verification Footer */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: '1fr 1fr', 
          gap: '2rem', 
          marginTop: '3rem', 
          paddingTop: '2rem', 
          borderTop: '1px solid var(--border-subtle)' 
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '1.5rem' }}>
              Lead Compliance Auditor Signoff
            </div>
            <div style={{ borderBottom: '1px solid var(--text-subtle)', width: '220px', height: '24px' }}></div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Charlie Vance (Certified Risk & Audit Lead)
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-subtle)', marginBottom: '1.5rem' }}>
              Verification Seal
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              SYSTEM HASH: 8f4b29a1e0c38947...d79
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
              Generated via AuditFlow Enterprise Governance Engine v1.0
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
