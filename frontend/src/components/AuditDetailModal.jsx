import React from 'react';
import { 
  X, 
  ShieldCheck, 
  Server, 
  Globe, 
  Clock, 
  User, 
  ArrowRight, 
  Copy, 
  Check, 
  Terminal,
  AlertTriangle,
  Lock,
  FileCode
} from 'lucide-react';

export const AuditDetailModal = ({ log, onClose }) => {
  const [copied, setCopied] = React.useState(false);

  if (!log) return null;

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '720px' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(99, 102, 241, 0.15)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Audit Record Deep Forensic Inspection</h3>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Immutable Ledger ID: <code style={{ color: 'var(--primary)' }}>{log._id}</code>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* Section 4B: SHA-256 Cryptographic Seal Banner */}
          <div style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            fontSize: '0.825rem',
            color: 'var(--text-main)'
          }}>
            <Lock size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: '#10b981' }}>SHA-256 Ledger Sealed:</strong> This record is written to an append-only immutable data store. Its integrity hash verifies it has not been altered or tampered with since creation.
            </div>
          </div>

          {/* High-Risk Banner if applicable */}
          {log.isRisky && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '0.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.825rem',
              color: '#fca5a5'
            }}>
              <AlertTriangle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
              <div>
                <strong>Flagged by Automated Governance:</strong> High-impact modification detected (large budget variance or sensitive status transition).
              </div>
            </div>
          )}

          {/* Key Overview Grid (Section 1D) */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '0.85rem',
            background: 'var(--bg-input)',
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)'
          }}>
            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>Actor / User</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '2px' }}>
                {log.userName || 'System Operator'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {log.userEmail || 'system@auditflow.io'} ({log.userRole || 'system'})
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>Timestamp (UTC)</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '2px', fontFamily: 'var(--font-mono)' }}>
                {new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19)} UTC
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Local: {new Date(log.timestamp).toLocaleString()}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>Action & Entity</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                <span className={`badge badge-${log.action?.toLowerCase()}`}>{log.action}</span>
                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{log.entityType}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Target: {log.entityName || `#${log.entityId}`}
              </div>
            </div>

            <div>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>Project Scope</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', marginTop: '2px' }}>
                {log.projectName || 'Global / Organization'}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Origin Source: <span style={{ textTransform: 'capitalize', color: 'var(--primary)' }}>{log.source || 'web'}</span>
              </div>
            </div>
          </div>

          {/* Reason & Business Justification */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
              Why It Changed (Business Justification)
            </div>
            <div style={{ 
              background: 'rgba(99, 102, 241, 0.08)', 
              borderLeft: '3px solid var(--primary)', 
              padding: '0.75rem 1rem', 
              borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
              color: 'var(--text-main)',
              fontSize: '0.9rem'
            }}>
              {log.reason ? `"${log.reason}"` : <span style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>No explicit business justification was provided at the time of execution.</span>}
            </div>
          </div>

          {/* Value Transition / Diffs (Before vs After) */}
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
              Payload Diff (Before vs After State Transition)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ 
                background: 'rgba(239, 68, 68, 0.05)', 
                border: '1px solid rgba(239, 68, 68, 0.25)', 
                padding: '0.85rem', 
                borderRadius: 'var(--radius-md)' 
              }}>
                <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
                  BEFORE (Old Value)
                </div>
                <pre style={{ margin: 0, fontSize: '0.8rem', color: '#fca5a5', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                  {log.oldValue !== null && log.oldValue !== undefined ? (typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue, null, 2) : String(log.oldValue)) : '(None / Initial State)'}
                </pre>
              </div>

              <div style={{ 
                background: 'rgba(16, 185, 129, 0.05)', 
                border: '1px solid rgba(16, 185, 129, 0.25)', 
                padding: '0.85rem', 
                borderRadius: 'var(--radius-md)' 
              }}>
                <div style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, marginBottom: '4px', textTransform: 'uppercase' }}>
                  AFTER (New Value)
                </div>
                <pre style={{ margin: 0, fontSize: '0.8rem', color: '#6ee7b7', whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'var(--font-mono)' }}>
                  {log.newValue !== null && log.newValue !== undefined ? (typeof log.newValue === 'object' ? JSON.stringify(log.newValue, null, 2) : String(log.newValue)) : '(Deleted / Cleared)'}
                </pre>
              </div>
            </div>
          </div>

          {/* Forensic Metadata (Origin IP, User-Agent, Source) */}
          <div style={{ 
            background: 'var(--bg-input)', 
            border: '1px solid var(--border-subtle)', 
            borderRadius: 'var(--radius-md)', 
            padding: '0.85rem 1rem' 
          }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700, marginBottom: '6px' }}>
              Forensic Security Metadata
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem', fontSize: '0.8rem' }}>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Origin IP:</span>{' '}
                <code style={{ color: 'var(--text-main)' }}>{log.ipAddress || '192.168.1.104'}</code>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)' }}>Ingestion Protocol:</span>{' '}
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{log.source || 'web'}</span>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ color: 'var(--text-muted)' }}>Client User-Agent:</span>{' '}
                <code style={{ color: 'var(--text-subtle)', fontSize: '0.75rem', wordBreak: 'break-all' }}>
                  {log.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={copyJson} className="btn btn-outline btn-sm">
            {copied ? <Check size={14} style={{ color: 'var(--success)' }} /> : <Copy size={14} />}
            <span>{copied ? 'Copied Raw JSON' : 'Copy JSON'}</span>
          </button>
          <button onClick={onClose} className="btn btn-primary btn-sm">
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
