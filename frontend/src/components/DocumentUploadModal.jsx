import React, { useState } from 'react';
import { api } from '../services/api';
import { X, UploadCloud, FileText, CheckCircle2 } from 'lucide-react';

export const DocumentUploadModal = ({ projectId, taskId, projects = [], onClose, onUploaded }) => {
  const [targetProjectId, setTargetProjectId] = useState(projectId || projects[0]?._id || '');
  const [name, setName] = useState('Technical Architecture & SOC-2 Specifications.pdf');
  const [category, setCategory] = useState('Specification');
  const [size, setSize] = useState('2.4 MB');
  const [reason, setReason] = useState('Uploaded technical architecture artifact for project sprint milestone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Document name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');

      if (taskId) {
        await api.tasks.addDocument(taskId, { name: name.trim(), size });
      } else if (targetProjectId) {
        await api.projects.addDocument(targetProjectId, {
          name: name.trim(),
          size,
          category,
          reason: reason.trim()
        });
      }

      if (onUploaded) onUploaded();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(14, 165, 233, 0.12)',
                color: '#0284c7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <UploadCloud size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Attach Project Document</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Upload specifications, compliance proofs, or task attachments
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

            {!projectId && !taskId && projects.length > 0 && (
              <div className="filter-input-group">
                <label className="filter-label">Target Project Scope *</label>
                <select
                  className="form-control"
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  required
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
                  ))}
                </select>
              </div>
            )}

            <div className="filter-input-group">
              <label className="filter-label">Document Title / Artifact Name *</label>
              <input
                type="text"
                className="form-control"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Architecture_Design_v2.pdf"
                required
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="filter-input-group">
                <label className="filter-label">Category</label>
                <select
                  className="form-control"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Specification">Technical Specification</option>
                  <option value="Compliance">Compliance & Security Proof</option>
                  <option value="Architecture">System Architecture</option>
                  <option value="Contract">Scope / Contract</option>
                </select>
              </div>

              <div className="filter-input-group">
                <label className="filter-label">File Size</label>
                <input
                  type="text"
                  className="form-control"
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  placeholder="e.g. 2.4 MB"
                />
              </div>
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Upload Justification (Audit Note)</label>
              <textarea
                className="form-control"
                rows="2"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for uploading this artifact..."
              ></textarea>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              <UploadCloud size={14} />
              <span>{loading ? 'Uploading...' : 'Attach & Record in Audit Log'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
