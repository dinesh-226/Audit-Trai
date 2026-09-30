import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Send, AlertCircle, ShieldAlert, ArrowRight, DollarSign, Calendar, FileText, CheckCircle2 } from 'lucide-react';

export const RequestChangeModal = ({ projects = [], preselectedProjectId, onClose, onRequestSubmitted }) => {
  const [projectId, setProjectId] = useState(preselectedProjectId || projects[0]?._id || '');
  const [changeType, setChangeType] = useState('BUDGET_INCREASE');
  const [title, setTitle] = useState('Budget increase for cloud infrastructure');
  const [fieldName, setFieldName] = useState('budget');
  const [oldValue, setOldValue] = useState(100000);
  const [newValue, setNewValue] = useState(120000);
  const [currency, setCurrency] = useState('₹');
  const [reason, setReason] = useState('Additional compute cluster resources needed for load testing and failover staging.');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const selectedProject = projects.find(p => p._id === projectId);

  useEffect(() => {
    if (selectedProject) {
      if (changeType === 'BUDGET_INCREASE') {
        setFieldName('budget');
        setOldValue(selectedProject.budget || 100000);
        if (Number(newValue) <= (selectedProject.budget || 0)) {
          setNewValue((selectedProject.budget || 100000) + 20000);
        }
      } else if (changeType === 'STATUS_OVERRIDE') {
        setFieldName('status');
        setOldValue(selectedProject.status || 'Active');
      }
    }
  }, [projectId, changeType]);

  const handleTypeChange = (type) => {
    setChangeType(type);
    if (type === 'BUDGET_INCREASE') {
      setTitle('Budget adjustment for project expansion');
      setFieldName('budget');
      setOldValue(selectedProject?.budget || 100000);
      setNewValue((selectedProject?.budget || 100000) + 20000);
    } else if (type === 'SCOPE_CHANGE') {
      setTitle('Sprint scope extension for critical compliance feature');
      setFieldName('category');
      setOldValue('Core Milestone');
      setNewValue('Extended Milestone (+3 Deliverables)');
    } else if (type === 'TIMELINE_EXTENSION') {
      setTitle('Milestone deadline extension');
      setFieldName('dueDate');
      setOldValue('2026-10-15');
      setNewValue('2026-11-30');
    } else if (type === 'STATUS_OVERRIDE') {
      setTitle('Emergency status change request');
      setFieldName('status');
      setOldValue(selectedProject?.status || 'Active');
      setNewValue('Under Review');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectId) {
      setError('Please select a project');
      return;
    }
    if (!title.trim() || !reason.trim()) {
      setError('Title and justification reason are required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      await api.changeRequests.create({
        projectId,
        changeType,
        title: title.trim(),
        fieldName,
        oldValue,
        newValue,
        currency,
        reason: reason.trim()
      });

      setSuccessMsg('Change request submitted successfully! Awaiting Administrator review.');
      if (onRequestSubmitted) onRequestSubmitted();
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      setError(err.message || 'Failed to submit change request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '600px' }} onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(234, 88, 12, 0.12)',
                color: '#ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <ShieldAlert size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Submit Sensitive Change Request</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Separation of Duties &bull; Administrator Approval Required
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Notice Alert */}
            <div style={{
              background: 'rgba(234, 88, 12, 0.08)',
              border: '1px solid rgba(234, 88, 12, 0.25)',
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.825rem',
              color: '#c2410c',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Governance Policy:</strong> Direct modifications to project budgets or critical scope settings are restricted. Your submission will be placed in the Admin Review Queue and logged permanently in the audit ledger.
              </div>
            </div>

            {successMsg && (
              <div style={{
                background: 'var(--success-bg)',
                color: '#15803d',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

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

            {/* Change Type Buttons */}
            <div>
              <label className="filter-label">Change Category</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={() => handleTypeChange('BUDGET_INCREASE')}
                  className={`btn btn-sm ${changeType === 'BUDGET_INCREASE' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.75rem', padding: '6px 4px', justifyContent: 'center' }}
                >
                  <DollarSign size={13} /> Budget Increase
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('SCOPE_CHANGE')}
                  className={`btn btn-sm ${changeType === 'SCOPE_CHANGE' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.75rem', padding: '6px 4px', justifyContent: 'center' }}
                >
                  <FileText size={13} /> Scope Change
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('TIMELINE_EXTENSION')}
                  className={`btn btn-sm ${changeType === 'TIMELINE_EXTENSION' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.75rem', padding: '6px 4px', justifyContent: 'center' }}
                >
                  <Calendar size={13} /> Timeline
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('STATUS_OVERRIDE')}
                  className={`btn btn-sm ${changeType === 'STATUS_OVERRIDE' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.75rem', padding: '6px 4px', justifyContent: 'center' }}
                >
                  <ShieldAlert size={13} /> Status Override
                </button>
              </div>
            </div>

            {/* Target Project */}
            <div className="filter-input-group">
              <label className="filter-label">Target Project Scope *</label>
              <select
                className="form-control"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                required
              >
                {projects.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} ({p.code}) — Current Budget: ₹{(p.budget || 0).toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div className="filter-input-group">
              <label className="filter-label">Request Title / Summary *</label>
              <input
                type="text"
                className="form-control"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Budget increase for cloud infrastructure"
                required
              />
            </div>

            {/* Diff Preview Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr auto 1fr',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--bg-input)',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Current (Old Value)
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '4px' }}>
                  {changeType === 'BUDGET_INCREASE' ? `₹${Number(oldValue).toLocaleString()}` : String(oldValue)}
                </div>
              </div>

              <div style={{ color: 'var(--text-muted)' }}>
                <ArrowRight size={20} />
              </div>

              <div>
                <div style={{ fontSize: '0.7rem', color: '#ea580c', textTransform: 'uppercase', fontWeight: 700 }}>
                  Requested (New Value) *
                </div>
                {changeType === 'BUDGET_INCREASE' ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                    <span style={{ fontWeight: 700 }}>₹</span>
                    <input
                      type="number"
                      className="form-control"
                      value={newValue}
                      onChange={(e) => setNewValue(Number(e.target.value))}
                      style={{ fontWeight: 700, fontSize: '1rem', padding: '4px 8px' }}
                      required
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    className="form-control"
                    value={newValue}
                    onChange={(e) => setNewValue(e.target.value)}
                    style={{ fontWeight: 700, fontSize: '0.9rem', padding: '4px 8px', marginTop: '4px' }}
                    required
                  />
                )}
              </div>
            </div>

            {/* Justification Reason */}
            <div className="filter-input-group">
              <label className="filter-label">Business Justification & Reason *</label>
              <textarea
                className="form-control"
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Explain why this budget or scope increase is needed. This will be permanently recorded in the audit trail."
                required
              ></textarea>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm" style={{ background: '#ea580c', borderColor: '#ea580c' }}>
              <Send size={14} />
              <span>{loading ? 'Submitting...' : 'Submit to Admin for Approval'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
