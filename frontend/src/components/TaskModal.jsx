import React, { useState, useEffect } from 'react';
import { X, CheckSquare, AlertCircle, UserCheck, Calendar, Tag } from 'lucide-react';
import { api } from '../services/api';

export const TaskModal = ({ task, projectId, users = [], onClose, onSave }) => {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'Todo');
  const [priority, setPriority] = useState(task?.priority || 'Medium');
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo?._id || task?.assignedTo || '');
  const [reason, setReason] = useState('');
  const [availableUsers, setAvailableUsers] = useState(users || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!users || users.length === 0) {
      api.auth.getUsers()
        .then((data) => setAvailableUsers(data || []))
        .catch((err) => console.error('Failed to load users for task assignment:', err));
    } else {
      setAvailableUsers(users);
    }
  }, [users]);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setDescription(task.description || '');
      setStatus(task.status || 'Todo');
      setPriority(task.priority || 'Medium');
      setAssignedTo(task.assignedTo?._id || task.assignedTo || '');
    }
  }, [task]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSave({
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignedTo: assignedTo || null,
        projectId,
        reason: reason || (task ? `Updated task details & status to ${status}` : 'Created new task in project backlog')
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const selectedUserObj = availableUsers.find(u => String(u._id) === String(assignedTo));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CheckSquare size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>
                  {task ? 'Edit Task & Assignee' : 'Create New Project Task'}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {task ? `Modifying task #${task._id}` : 'Assigning work to team members with audit traceability'}
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
                color: 'var(--danger)',
                border: '1px solid var(--danger-border)',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <div className="filter-input-group">
              <label className="filter-label">Task Title *</label>
              <input
                type="text"
                className="form-control"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Implement Zero-Trust Role-Based Access Control"
              />
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Description & Requirements</label>
              <textarea
                className="form-control"
                rows="2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief technical details or sprint acceptance criteria..."
              ></textarea>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="filter-input-group">
                <label className="filter-label">Status Stage</label>
                <select
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="Todo">Todo (Backlog)</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review (QA)</option>
                  <option value="Done">Done (Completed)</option>
                  <option value="Blocked">Blocked (Needs Help)</option>
                </select>
              </div>

              <div className="filter-input-group">
                <label className="filter-label">Priority Level</label>
                <select
                  className="form-control"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>
            </div>

            {/* Assignee Selection */}
            <div className="filter-input-group">
              <label className="filter-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Assign To Team Member</span>
                {selectedUserObj && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--primary)', textTransform: 'capitalize', fontWeight: 600 }}>
                    Role: {selectedUserObj.role} • {selectedUserObj.department || 'General'}
                  </span>
                )}
              </label>
              <select
                className="form-control"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
              >
                <option value="">-- Select Team Member (Unassigned) --</option>
                {availableUsers.map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.name} ({u.email}) — [{u.role?.toUpperCase()}] {u.department ? `• ${u.department}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Business Justification / Change Context</label>
              <input
                type="text"
                className="form-control"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g. Assigned to engineering lead for Q3 sprint kickoff"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              {loading ? 'Saving to Atlas...' : task ? 'Update Task & Record Audit' : 'Assign & Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
