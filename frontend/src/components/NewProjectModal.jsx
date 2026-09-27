import React, { useState } from 'react';
import { X, FolderPlus, AlertCircle } from 'lucide-react';

export const NewProjectModal = ({ onClose, onCreated }) => {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState(100000);
  const [category, setCategory] = useState('Software Development');
  const [reason, setReason] = useState('New corporate initiative chartered');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onCreated({
        name,
        code: code.trim() || undefined,
        description,
        budget: Number(budget) || 0,
        category,
        reason
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(99, 102, 241, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <FolderPlus size={20} />
              </div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Create New Tracked Project</h3>
            </div>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {error && (
              <div style={{
                background: 'var(--danger-bg)',
                color: '#f87171',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.75rem' }}>
              <div className="filter-input-group">
                <label className="filter-label">Project Name *</label>
                <input
                  type="text"
                  className="form-control"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Project Zeta"
                />
              </div>

              <div className="filter-input-group">
                <label className="filter-label">Code / Key</label>
                <input
                  type="text"
                  className="form-control"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="PROJ-200"
                />
              </div>
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Category</label>
              <select
                className="form-control"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Software Development">Software Development</option>
                <option value="Cloud Infrastructure">Cloud Infrastructure</option>
                <option value="Fintech Automation">Fintech Automation</option>
                <option value="AI / Governance">AI / Governance</option>
                <option value="Security & Compliance">Security & Compliance</option>
              </select>
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Initial Baseline Budget ($ USD)</label>
              <input
                type="number"
                step="1000"
                className="form-control"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Description</label>
              <textarea
                className="form-control"
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="High-level project scope and goals..."
              ></textarea>
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Audit Initiation Reason</label>
              <input
                type="text"
                className="form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? 'Creating...' : 'Create & Initialise Audit Trail'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
