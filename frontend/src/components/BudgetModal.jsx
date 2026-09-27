import React, { useState } from 'react';
import { X, DollarSign, AlertCircle } from 'lucide-react';

export const BudgetModal = ({ project, onClose, onSave }) => {
  const [amount, setAmount] = useState(project?.budget || 0);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNaN(Number(amount)) || Number(amount) < 0) {
      setError('Please provide a valid budget amount');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave(Number(amount), reason);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update budget');
    } finally {
      setLoading(false);
    }
  };

  const oldBudget = project?.budget || 0;
  const newBudget = Number(amount) || 0;
  const diff = newBudget - oldBudget;

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
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Adjust Project Budget</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {project?.name} ({project?.code})
                </div>
              </div>
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
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Current vs Proposed Live Summary */}
            <div style={{
              background: 'var(--bg-input)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Current Budget</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  ${oldBudget.toLocaleString()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Variance</div>
                <div style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: 700, 
                  color: diff > 0 ? '#10b981' : diff < 0 ? '#ef4444' : 'var(--text-muted)' 
                }}>
                  {diff > 0 ? `+$${diff.toLocaleString()}` : diff < 0 ? `-$${Math.abs(diff).toLocaleString()}` : '$0'}
                </div>
              </div>
            </div>

            {/* Field: Amount */}
            <div className="filter-input-group">
              <label className="filter-label">New Budget Amount ($ USD) *</label>
              <input
                type="number"
                step="500"
                className="form-control"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 120000"
              />
            </div>

            {/* Field: Reason */}
            <div className="filter-input-group">
              <label className="filter-label">
                Reason / Business Justification (Audited)
              </label>
              <textarea
                className="form-control"
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Extra scope from client for multi-tenant isolation..."
              ></textarea>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-subtle)' }}>
                ℹ️ This justification is permanently recorded in the immutable audit trail with your name and timestamp.
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? 'Recording Audit...' : 'Save & Log Audit Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
