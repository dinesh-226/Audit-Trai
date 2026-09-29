import React from 'react';
import { 
  ArrowRight, 
  Eye, 
  AlertTriangle, 
  Globe, 
  Server, 
  GitBranch, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ShieldCheck, 
  Search, 
  RotateCcw,
  FileText
} from 'lucide-react';

export const AuditTable = ({ logs = [], onSelectLog, onResetFilters, loading = false }) => {
  const formatTime = (dateStr) => {
    const d = new Date(dateStr);
    return {
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      iso: d.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
    };
  };

  const getPlainLanguageAction = (log) => {
    const { action, entityType, fieldName } = log;
    if (action === 'CREATE') {
      return `Created ${entityType}`;
    }
    if (action === 'DELETE') {
      return `Deleted ${entityType}`;
    }
    if (action === 'APPROVE') {
      return `Approved Compliance Gate`;
    }
    if (action === 'REJECT') {
      return `Rejected Request`;
    }
    if (action === 'UPDATE') {
      if (entityType === 'Budget' || fieldName === 'amount') return 'Updated Budget Allocation';
      if (entityType === 'Task' && fieldName === 'status') return 'Transitioned Task Status';
      if (entityType === 'Member') return 'Modified Team Access';
      return `Updated ${entityType} ${fieldName ? `(${fieldName})` : ''}`;
    }
    return `${action} ${entityType}`;
  };

  const renderOutcomeBadge = (log) => {
    if (log.isRisky) {
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ 
            fontSize: '0.7rem', 
            fontWeight: 700, 
            color: '#f87171', 
            background: 'rgba(239, 68, 68, 0.15)', 
            padding: '2px 6px', 
            borderRadius: '4px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '3px'
          }}>
            <AlertTriangle size={10} /> HIGH-RISK
          </span>
        </div>
      );
    }
    return (
      <span style={{ 
        fontSize: '0.7rem', 
        fontWeight: 700, 
        color: '#10b981', 
        background: 'rgba(16, 185, 129, 0.12)', 
        padding: '2px 6px', 
        borderRadius: '4px',
        border: '1px solid rgba(16, 185, 129, 0.25)',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '3px'
      }}>
        <CheckCircle2 size={10} /> SUCCESS
      </span>
    );
  };

  const renderValueDiff = (log) => {
    const { oldValue, newValue } = log;

    if (oldValue === null && newValue === null) {
      return <span style={{ color: 'var(--text-subtle)', fontStyle: 'italic', fontSize: '0.8rem' }}>No delta recorded</span>;
    }

    const formatVal = (v) => {
      if (v === null || v === undefined) return 'None';
      if (typeof v === 'number') return `$${v.toLocaleString()}`;
      if (typeof v === 'object') {
        if (v.name) return v.name;
        const str = JSON.stringify(v);
        return str.length > 20 ? str.substring(0, 20) + '...' : str;
      }
      return String(v);
    };

    if (oldValue !== null && newValue !== null) {
      return (
        <div className="diff-container" style={{ marginTop: '3px' }}>
          <span className="diff-old">{formatVal(oldValue)}</span>
          <ArrowRight size={12} className="diff-arrow" />
          <span className="diff-new">{formatVal(newValue)}</span>
        </div>
      );
    }

    if (newValue !== null) {
      return (
        <div className="diff-container" style={{ marginTop: '3px' }}>
          <span className="diff-new">Set: {formatVal(newValue)}</span>
        </div>
      );
    }

    if (oldValue !== null) {
      return (
        <div className="diff-container" style={{ marginTop: '3px' }}>
          <span className="diff-old">Removed: {formatVal(oldValue)}</span>
        </div>
      );
    }

    return null;
  };

  const renderSourceBadge = (source) => {
    if (source === 'integration_jira') {
      return (
        <span style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px', 
          fontSize: '0.725rem', 
          color: '#38bdf8',
          background: 'rgba(56, 189, 248, 0.1)',
          padding: '2px 7px',
          borderRadius: '4px',
          border: '1px solid rgba(56, 189, 248, 0.2)'
        }}>
          <GitBranch size={11} /> Jira Sync
        </span>
      );
    }
    if (source === 'api') {
      return (
        <span style={{ 
          display: 'inline-flex', 
          alignItems: 'center', 
          gap: '4px', 
          fontSize: '0.725rem', 
          color: '#a78bfa',
          background: 'rgba(167, 139, 250, 0.1)',
          padding: '2px 7px',
          borderRadius: '4px',
          border: '1px solid rgba(167, 139, 250, 0.2)'
        }}>
          <Server size={11} /> REST API
        </span>
      );
    }
    return (
      <span style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        gap: '4px', 
        fontSize: '0.725rem', 
        color: '#94a3b8',
        background: 'rgba(255, 255, 255, 0.05)',
        padding: '2px 7px',
        borderRadius: '4px',
        border: '1px solid var(--border-subtle)'
      }}>
        <Globe size={11} /> Web UI
      </span>
    );
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3.5rem' }}>
        <div style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 600 }}>Loading Audit Stream...</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Querying immutable ledger records from MongoDB Atlas</div>
      </div>
    );
  }

  // Section 4C: Empty State Copy
  if (logs.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <div style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'rgba(99, 102, 241, 0.1)',
          color: 'var(--primary)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem'
        }}>
          <Search size={26} />
        </div>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: 'var(--text-main)' }}>
          No Audit Logs Match Filter
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: '440px', margin: '0 auto 1.5rem auto', lineHeight: 1.5 }}>
          We couldn't find any recorded events matching your current date range or selected criteria.
        </p>
        {onResetFilters && (
          <button onClick={onResetFilters} className="btn btn-outline btn-sm">
            <RotateCcw size={14} />
            <span>Reset All Filters</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="table-container fade-in">
      <table className="audit-table">
        <thead>
          <tr>
            <th style={{ width: '15%' }}>Timestamp (UTC)</th>
            <th style={{ width: '18%' }}>User & Role</th>
            <th style={{ width: '16%' }}>Action (Plain Language)</th>
            <th style={{ width: '15%' }}>Target Entity</th>
            <th style={{ width: '18%' }}>Outcome & Values</th>
            <th style={{ width: '14%' }}>Business Justification</th>
            <th style={{ width: '10%' }}>Source</th>
            <th style={{ textAlign: 'right', width: '4%' }}>Inspect</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => {
            const timeObj = formatTime(log.timestamp);
            return (
              <tr 
                key={log._id} 
                onClick={() => onSelectLog(log)}
                style={{ cursor: 'pointer' }}
              >
                {/* 1. Timestamp (UTC) */}
                <td style={{ whiteSpace: 'nowrap' }}>
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                    {timeObj.date}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                    <Clock size={11} /> {timeObj.time}
                  </div>
                </td>

                {/* 2. User & Role */}
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '28px', 
                      height: '28px', 
                      borderRadius: '50%', 
                      background: 'rgba(99, 102, 241, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#818cf8',
                      flexShrink: 0
                    }}>
                      {log.userName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                        {log.userName || 'System Operator'}
                      </div>
                      <div style={{ fontSize: '0.725rem', marginTop: '1px' }}>
                        <span className={`badge-role badge-${log.userRole || 'member'}`}>
                          {log.userRole || 'system'}
                        </span>
                      </div>
                    </div>
                  </div>
                </td>

                {/* 3. Action (Plain Language) */}
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {getPlainLanguageAction(log)}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', marginTop: '2px' }}>
                    Type: <code style={{ color: 'var(--primary)' }}>{log.action}</code>
                  </div>
                </td>

                {/* 4. Target Entity */}
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                    {log.entityType}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.entityName || `#${log.entityId}`}
                  </div>
                </td>

                {/* 5. Outcome & Values */}
                <td>
                  <div style={{ marginBottom: '2px' }}>
                    {renderOutcomeBadge(log)}
                  </div>
                  {renderValueDiff(log)}
                </td>

                {/* 6. Business Justification / Notes */}
                <td style={{ maxWidth: '200px' }}>
                  {log.reason ? (
                    <div style={{ 
                      fontSize: '0.825rem', 
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }} title={log.reason}>
                      "{log.reason}"
                    </div>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>
                      No reason provided
                    </span>
                  )}
                </td>

                {/* 7. Source */}
                <td>{renderSourceBadge(log.source)}</td>

                {/* 8. Inspect Button */}
                <td style={{ textAlign: 'right' }}>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLog(log);
                    }}
                    className="btn btn-outline btn-sm"
                    style={{ padding: '4px 8px' }}
                    title="View complete audit record details"
                  >
                    <Eye size={13} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
