import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Users, 
  ShieldCheck, 
  Mail, 
  Building, 
  Calendar, 
  CheckSquare, 
  Search, 
  UserCheck,
  Shield,
  Layers,
  Award,
  Edit3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export const TeamDirectory = ({ onSelectProject }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Role Edit state
  const [editingUser, setEditingUser] = useState(null);
  const [selectedNewRole, setSelectedNewRole] = useState('developer');
  const [roleChangeReason, setRoleChangeReason] = useState('Role adjustment per governance delegation');
  const [roleUpdating, setRoleUpdating] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    loadTeamData();
  }, []);

  const loadTeamData = async () => {
    try {
      setLoading(true);
      const [usersData, tasksData] = await Promise.all([
        api.auth.getUsers(),
        api.tasks.getAll()
      ]);
      setUsers(usersData || []);
      setTasks(tasksData || []);
    } catch (err) {
      console.error('Failed to load team directory data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRoleSubmit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      setRoleUpdating(true);
      setFeedback({ type: '', message: '' });

      const res = await api.auth.updateUserRole(editingUser._id, selectedNewRole, roleChangeReason.trim());
      setFeedback({
        type: 'success',
        message: res.message || `Role updated to ${selectedNewRole}`
      });

      setEditingUser(null);
      await loadTeamData();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to update user role'
      });
    } finally {
      setRoleUpdating(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.department?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'badge-admin';
      case 'manager': return 'badge-manager';
      case 'auditor': return 'badge-auditor';
      case 'developer': return 'badge-member';
      default: return 'badge-member';
    }
  };

  const getRoleTitle = (role) => {
    switch (role) {
      case 'admin': return 'System Administrator';
      case 'manager': return 'Project Manager';
      case 'auditor': return 'Compliance Auditor';
      case 'developer': return 'Developer / Contributor';
      default: return 'Team Member / Contributor';
    }
  };

  const getRolePermissions = (role) => {
    switch (role) {
      case 'admin': return 'Full governance, user administration, project chartering & archiving, change approval, immutable audit access.';
      case 'manager': return 'Project chartering, task assignment, review change requests, sprint backlog delivery.';
      case 'auditor': return 'Read-only compliance inspection, cryptographic ledger verification, formal reporting.';
      case 'developer': return 'Create/update assigned tasks, submit sensitive change requests, upload documents, inspect audit trail.';
      default: return 'Task execution, status transitions, backlog self-assignment.';
    }
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: 'var(--radius-sm)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Users size={18} />
            </div>
            <h1 style={{ fontSize: '1.75rem', margin: 0 }}>Team & Role Governance</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.35rem' }}>
            User role-based access levels, permission governance, and active task workloads
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="badge" style={{ background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-subtle)' }}>
            Total Personnel: {users.length}
          </span>
        </div>
      </div>

      {feedback.message && (
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
          color: feedback.type === 'success' ? '#15803d' : '#b91c1c'
        }}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Role Summary Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
        gap: '1rem', 
        marginBottom: '1.75rem' 
      }}>
        {['admin', 'manager', 'developer', 'auditor'].map((roleKey) => {
          const count = users.filter(u => u.role === roleKey || (roleKey === 'developer' && u.role === 'member')).length;
          return (
            <div 
              key={roleKey} 
              className="card" 
              style={{ 
                padding: '1.15rem', 
                cursor: 'pointer',
                borderColor: roleFilter === roleKey ? 'var(--primary)' : 'var(--border-subtle)',
                background: roleFilter === roleKey ? 'rgba(99, 102, 241, 0.04)' : '#ffffff'
              }}
              onClick={() => setRoleFilter(roleFilter === roleKey ? 'all' : roleKey)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span className={`badge-role ${getRoleBadgeClass(roleKey)}`} style={{ fontSize: '0.75rem' }}>
                  {roleKey.toUpperCase()}
                </span>
                <span style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {count}
                </span>
              </div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {getRoleTitle(roleKey)}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.3 }}>
                {getRolePermissions(roleKey)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Search & Filter Bar */}
      <div className="filter-bar" style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '36px' }}
            placeholder="Search team member by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => setRoleFilter('all')}
            className={`btn btn-sm ${roleFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          >
            All Roles ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('admin')}
            className={`btn btn-sm ${roleFilter === 'admin' ? 'btn-primary' : 'btn-outline'}`}
          >
            Admins ({users.filter(u => u.role === 'admin').length})
          </button>
          <button
            onClick={() => setRoleFilter('developer')}
            className={`btn btn-sm ${roleFilter === 'developer' ? 'btn-primary' : 'btn-outline'}`}
          >
            Developers ({users.filter(u => ['developer', 'member'].includes(u.role)).length})
          </button>
          <button
            onClick={() => setRoleFilter('auditor')}
            className={`btn btn-sm ${roleFilter === 'auditor' ? 'btn-primary' : 'btn-outline'}`}
          >
            Auditors ({users.filter(u => u.role === 'auditor').length})
          </button>
        </div>
      </div>

      {/* Personnel Grid */}
      {loading ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading team directory...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <Users size={32} style={{ color: 'var(--text-subtle)', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>No Personnel Found</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Try adjusting your search criteria or role filters.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {filteredUsers.map((u) => {
            const userTasks = tasks.filter(t => {
              const aId = t.assignedTo?._id || t.assignedTo;
              return aId && (String(aId) === String(u._id) || t.assignedTo?.email === u.email);
            });
            const isCurrentUser = String(u._id) === String(user?.id || user?._id);

            return (
              <div 
                key={u._id} 
                className="card"
                style={{ 
                  padding: '1.25rem', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  justifyContent: 'space-between',
                  borderColor: isCurrentUser ? 'var(--primary)' : 'var(--border-subtle)',
                  background: isCurrentUser ? '#fbfcfe' : '#ffffff'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: 44,
                        height: 44,
                        borderRadius: '50%',
                        background: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '1rem'
                      }}>
                        {u.name?.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <h3 style={{ fontSize: '1rem', margin: 0, color: 'var(--text-main)' }}>{u.name}</h3>
                          {isCurrentUser && (
                            <span style={{ fontSize: '0.65rem', background: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                              YOU
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                          <Mail size={12} />
                          <span>{u.email}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`badge-role ${getRoleBadgeClass(u.role)}`} style={{ fontSize: '0.7rem' }}>
                      {u.role || 'member'}
                    </span>
                  </div>

                  <div style={{ 
                    background: 'var(--bg-input)', 
                    border: '1px solid var(--border-subtle)', 
                    borderRadius: 'var(--radius-sm)', 
                    padding: '0.75rem',
                    fontSize: '0.8rem',
                    marginBottom: '1rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Department:</span>
                      <strong style={{ color: 'var(--text-main)' }}>{u.department || 'General'}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Assigned Tasks:</span>
                      <strong style={{ color: userTasks.length > 0 ? 'var(--primary)' : 'var(--text-main)' }}>
                        {userTasks.length} {userTasks.length === 1 ? 'task' : 'tasks'}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Joined:</span>
                      <span style={{ color: 'var(--text-subtle)' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Workspace Member'}
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem', marginBottom: '0.5rem' }}>
                    <strong>Role Scope:</strong> {getRolePermissions(u.role)}
                  </div>

                  {/* Admin Change Role button */}
                  {isAdmin && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUser(u);
                          setSelectedNewRole(u.role || 'developer');
                        }}
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                      >
                        <Edit3 size={12} /> Change Role & Permissions
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Role Change Modal for Admin */}
      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" style={{ maxWidth: '480px' }} onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleUpdateRoleSubmit}>
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={20} style={{ color: 'var(--primary)' }} />
                  <div>
                    <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Modify Role: {editingUser.name}</h3>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Governance Permission Assignment &bull; Audit Trail Logged
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="filter-input-group">
                  <label className="filter-label">New System Role *</label>
                  <select
                    className="form-control"
                    value={selectedNewRole}
                    onChange={(e) => setSelectedNewRole(e.target.value)}
                  >
                    <option value="developer">Developer (Task execution, change requests, document uploads)</option>
                    <option value="admin">Administrator (Full governance, approvals, project creation & archive)</option>
                    <option value="auditor">Compliance Auditor (Strictly read-only inspection & report export)</option>
                    <option value="manager">Project Manager (Chartering, sprint delivery, review requests)</option>
                    <option value="member">Team Member</option>
                  </select>
                </div>

                <div className="filter-input-group">
                  <label className="filter-label">Governance Reason (Logged in Audit Ledger) *</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={roleChangeReason}
                    onChange={(e) => setRoleChangeReason(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setEditingUser(null)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
                <button type="submit" disabled={roleUpdating} className="btn btn-primary btn-sm">
                  <span>{roleUpdating ? 'Saving...' : 'Confirm Role Change'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
