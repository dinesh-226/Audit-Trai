import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Archive, AlertTriangle, CheckCircle2, Shield } from 'lucide-react';

export const ProjectArchiveModal = ({ project, onClose, onArchived }) => {
  const [reason, setReason] = useState('Project development completed & initiative moved to long-term compliance archive.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleArchive = async (e) => {
    e.preventDefault();
    if (!project?._id) return;

    try {
      setLoading(true);
      setError('');
      await api.projects.archive(project._id, reason.trim());
      if (onArchived) onArchived();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to archive project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleArchive}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(217, 119, 6, 0.15)',
                color: '#d97706',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Archive size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Archive Project: {project?.name}</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Audit Evidence Preservation &bull; Status: Archived
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{
              background: 'rgba(217, 119, 6, 0.08)',
              border: '1px solid rgba(217, 119, 6, 0.25)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              color: '#b45309',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <Shield size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Audit Compliance Guarantee:</strong> Archiving removes this project from active development views, but keeps all tasks, documents, comments, and the complete immutable audit trail 100% intact for future auditor inspections.
              </div>
            </div>

            {error && (
              <div style={{
                background: 'var(--danger-bg)',
                color: '#b91c1c',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <div className="filter-input-group">
              <label className="filter-label">Reason for Archiving *</label>
              <textarea
                className="form-control"
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this project is being archived (recorded in audit log)..."
                required
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm" style={{ background: '#d97706', borderColor: '#d97706' }}>
              <Archive size={14} />
              <span>{loading ? 'Archiving...' : 'Confirm Project Archive'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
