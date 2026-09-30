import React from 'react';
import { 
  Clock, 
  ArrowRight, 
  AlertTriangle, 
  ExternalLink, 
  DollarSign, 
  CheckSquare, 
  FileText, 
  CheckCircle, 
  Folder, 
  Users,
  ShieldAlert,
  GitCommit
} from 'lucide-react';

export const AuditTimeline = ({ logs = [], onSelectLog }) => {
  const getEntityIcon = (type) => {
    switch (type) {
      case 'Budget': return <DollarSign size={16} />;
      case 'Task': return <CheckSquare size={16} />;
      case 'Project': return <Folder size={16} />;
      case 'Document': return <FileText size={16} />;
      case 'Approval': return <CheckCircle size={16} />;
      case 'Member': return <Users size={16} />;
      default: return <GitCommit size={16} />;
    }
  };

  const getHumanNarrative = (log) => {
    const actor = log.userName || 'Someone';
    const entity = log.entityType;
    const name = log.entityName || `#${log.entityId}`;

    if (log.action === 'CREATE') {
      return (
        <span>
          <strong>{actor}</strong> created new {entity.toLowerCase()} <strong>"{name}"</strong>.
        </span>
      );
    }
    if (log.action === 'DELETE') {
      return (
        <span>
          <strong>{actor}</strong> deleted {entity.toLowerCase()} <strong>"{name}"</strong>.
        </span>
      );
    }
    if (log.action === 'APPROVE') {
      return (
        <span>
          <strong>{actor}</strong> approved <strong>"{name}"</strong>.
        </span>
      );
    }
    if (log.action === 'REJECT') {
      return (
        <span>
          <strong>{actor}</strong> rejected <strong>"{name}"</strong>.
        </span>
      );
    }

    // Update case
    if (entity === 'Budget') {
      const oldVal = typeof log.oldValue === 'number' ? `$${log.oldValue.toLocaleString()}` : log.oldValue;
      const newVal = typeof log.newValue === 'number' ? `$${log.newValue.toLocaleString()}` : log.newValue;
      return (
        <span>
          <strong>{actor}</strong> updated <strong>Budget</strong> for {log.projectName || name} from <strong>{oldVal}</strong> to <strong>{newVal}</strong>.
        </span>
      );
    }

    if (log.fieldName) {
      return (
        <span>
          <strong>{actor}</strong> changed <strong>{log.fieldName}</strong> on {entity.toLowerCase()} <strong>"{name}"</strong>.
        </span>
      );
    }

    return (
      <span>
        <strong>{actor}</strong> modified {entity.toLowerCase()} <strong>"{name}"</strong>.
      </span>
    );
  };

  if (logs.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <Clock size={36} style={{ color: 'var(--text-subtle)', margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No Timeline Events Found</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          No actions recorded matching the current filter parameters.
        </p>
      </div>
    );
  }

  return (
    <div className="timeline-container fade-in">
      {logs.map((log) => {
        const d = new Date(log.timestamp);
        const formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const formattedTime = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

        return (
          <div key={log._id} className="timeline-item">
            {/* Timeline Dot Icon */}
            <div 
              className="timeline-dot"
              style={{
                borderColor: log.isRisky ? 'var(--danger)' : 'var(--primary)',
                color: log.isRisky ? 'var(--danger)' : 'var(--primary)',
                background: log.isRisky ? 'rgba(239, 68, 68, 0.1)' : 'var(--bg-surface)'
              }}
            >
              {getEntityIcon(log.entityType)}
            </div>

            {/* Timeline Card */}
            <div className="timeline-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                    {formattedDate} at {formattedTime}
                  </span>
                  <span className={`badge badge-role badge-${log.userRole || 'member'}`}>
                    {log.userRole || 'system'}
                  </span>
                  {log.isRisky && (
                    <span className="badge badge-risky">
                      <AlertTriangle size={11} /> High Impact Change
                    </span>
                  )}
                </div>

                <button 
                  onClick={() => onSelectLog(log)}
                  className="btn btn-outline btn-sm"
                  style={{ padding: '2px 8px', fontSize: '0.75rem', gap: '4px' }}
                >
                  <ExternalLink size={12} />
                  <span>Show Details</span>
                </button>
              </div>

              {/* Narrative Story Line */}
              <div className="narrative-story">
                {getHumanNarrative(log)}
              </div>

              {/* Value Diff representation */}
              {(log.oldValue !== null || log.newValue !== null) && (
                <div style={{ 
                  background: 'rgba(15, 23, 42, 0.4)', 
                  padding: '0.5rem 0.75rem', 
                  borderRadius: 'var(--radius-sm)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.825rem',
                  marginBottom: '0.5rem'
                }}>
                  <span style={{ color: 'var(--text-subtle)', fontSize: '0.75rem' }}>State Transition:</span>
                  {log.oldValue !== null && (
                    <span className="diff-old">
                      {typeof log.oldValue === 'object' ? JSON.stringify(log.oldValue) : String(log.oldValue)}
                    </span>
                  )}
                  <ArrowRight size={13} className="diff-arrow" />
                  {log.newValue !== null && (
                    <span className="diff-new">
                      {typeof log.newValue === 'object' ? JSON.stringify(log.newValue) : String(log.newValue)}
                    </span>
                  )}
                </div>
              )}

              {/* Reason / Context Callout */}
              {log.reason && (
                <div className="narrative-reason">
                  <strong>Why it changed:</strong> "{log.reason}"
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
