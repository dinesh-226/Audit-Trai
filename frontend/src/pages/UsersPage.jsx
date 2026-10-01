import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Shield,
  Key,
  CheckCircle,
  XCircle,
  UserCheck,
  UserX,
  UserPlus,
  RotateCcw,
  Search,
  Filter,
  AlertTriangle,
  Lock,
  Trash2,
  RefreshCw,
  Anchor,
  Ship,
  Check,
  X
} from 'lucide-react';

export const UsersPage = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [securityStats, setSecurityStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'port_manager',
    department: 'Maritime Operations',
    assignedPort: 'Mumbai Port',
    assignedShipId: ''
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);

  // Reset Password Modal
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // Delete User Confirmation Modal
  const [deleteModalUser, setDeleteModalUser] = useState(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [searchTerm, roleFilter, statusFilter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersData, pendingData, secStats] = await Promise.all([
        api.auth.getUsers ? api.auth.getUsers({
          search: searchTerm,
          role: roleFilter,
          status: statusFilter
        }).catch(() => api.auth.getDemoUsers()) : api.auth.getDemoUsers(),
        api.auth.getPendingUsers ? api.auth.getPendingUsers().catch(() => []) : [],
        api.auth.getSecurityStats ? api.auth.getSecurityStats().catch(() => null) : null
      ]);

      setUsers(Array.isArray(usersData) ? usersData : []);
      setPendingUsers(Array.isArray(pendingData) ? pendingData : []);
      setSecurityStats(secStats);
    } catch (e) {
      console.error('Error loading users:', e);
      setActionMessage({ type: 'error', text: `Failed to load users: ${e.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.auth.updateUserRole(userId, newRole);
      setActionMessage({ type: 'success', text: `Officer role updated to "${newRole.replace('_', ' ').toUpperCase()}". Audit event recorded.` });
      await fetchData();
    } catch (e) {
      setActionMessage({ type: 'error', text: `Error updating role: ${e.message}` });
    }
  };

  const handleApproval = async (userObjOrId, actionOrStatus) => {
    try {
      const targetId = typeof userObjOrId === 'object' ? (userObjOrId.userId || userObjOrId._id) : userObjOrId;
      const normalizedAction = (actionOrStatus || '').toLowerCase().startsWith('app') ? 'approve' : 'reject';
      await api.auth.updateUserApproval(targetId, normalizedAction);
      setActionMessage({
        type: 'success',
        text: `Officer registration ${normalizedAction === 'approve' ? 'APPROVED & ACTIVATED' : 'REJECTED'}. Immutable audit block generated.`
      });
      await fetchData();
    } catch (e) {
      setActionMessage({ type: 'error', text: `Failed to update approval: ${e.message}` });
    }
  };

  const handleToggleStatus = async (userObj) => {
    if (userObj.userId === currentUser?.userId) {
      setActionMessage({ type: 'error', text: 'You cannot deactivate your own active session.' });
      return;
    }
    const newStatus = !userObj.isActive;
    try {
      await api.auth.toggleUserStatus(userObj.userId || userObj._id, newStatus);
      setActionMessage({
        type: 'success',
        text: `Officer account for ${userObj.name} has been ${newStatus ? 'ACTIVATED' : 'DEACTIVATED'}. Action logged in audit chain.`
      });
      await fetchData();
    } catch (e) {
      setActionMessage({ type: 'error', text: `Failed to toggle account status: ${e.message}` });
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateSubmitting(true);
    try {
      await api.auth.createUser(createFormData);
      setActionMessage({
        type: 'success',
        text: `New Officer Account created for ${createFormData.name} (${createFormData.email}). Auto-approved & active.`
      });
      setShowCreateModal(false);
      setCreateFormData({
        name: '',
        email: '',
        password: '',
        role: 'port_manager',
        department: 'Maritime Operations',
        assignedPort: 'Mumbai Port',
        assignedShipId: ''
      });
      await fetchData();
    } catch (e) {
      setActionMessage({ type: 'error', text: `Failed to create user: ${e.message}` });
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleAdminResetPassword = async (e) => {
    e.preventDefault();
    if (!resetModalUser) return;
    setResetSubmitting(true);
    try {
      const res = await api.auth.adminResetPassword(
        resetModalUser.userId || resetModalUser._id,
        newPasswordInput || 'password123'
      );
      setActionMessage({
        type: 'success',
        text: res.message || `Password reset successfully for ${resetModalUser.name}.`
      });
      setResetModalUser(null);
      setNewPasswordInput('');
      await fetchData();
    } catch (e) {
      setActionMessage({ type: 'error', text: `Failed to reset password: ${e.message}` });
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deleteModalUser) return;
    setDeleteSubmitting(true);
    try {
      await api.auth.deleteUser(deleteModalUser.userId || deleteModalUser._id);
      setActionMessage({
        type: 'success',
        text: `Officer account for ${deleteModalUser.name} (${deleteModalUser.email}) was permanently deleted. Deletion record logged in audit trail.`
      });
      setDeleteModalUser(null);
      await fetchData();
    } catch (e) {
      setActionMessage({ type: 'error', text: `Failed to delete user: ${e.message}` });
    } finally {
      setDeleteSubmitting(false);
    }
  };

  // Metrics
  const totalCount = securityStats?.totalUsers ?? users.length;
  const activeCount = securityStats?.activeUsers ?? users.filter(u => u.isActive !== false).length;
  const inactiveCount = securityStats?.inactiveUsers ?? users.filter(u => u.isActive === false).length;
  const pendingCount = securityStats?.pendingUsers ?? pendingUsers.length;
  const suspiciousCount = securityStats?.suspiciousAccountsCount ?? users.filter(u => (u.failedLoginAttempts || 0) > 0).length;

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            USER MANAGEMENT
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            User Management
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage user accounts, assign roles, approve new registrations, and reset passwords
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <button
            onClick={() => fetchData()}
            className="btn btn-secondary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}
          >
            <UserPlus size={16} />
            <span>+ Add User</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div style={{
          marginBottom: '20px',
          padding: '12px 18px',
          borderRadius: '10px',
          background: actionMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
          border: `1px solid ${actionMessage.type === 'success' ? '#86efac' : '#fecaca'}`,
          color: actionMessage.type === 'success' ? '#15803d' : '#b91c1c',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px',
          fontWeight: 600,
          boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
        }}>
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontWeight: 700, fontSize: '16px' }}
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div className="maritime-card" style={{ padding: '18px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Total Registered</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>{totalCount}</div>
          <div style={{ fontSize: '12px', color: '#0284c7', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Users size={13} /> Complete User Base
          </div>
        </div>

        <div className="maritime-card" style={{ padding: '18px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Active Officers</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>{activeCount}</div>
          <div style={{ fontSize: '12px', color: '#15803d', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <CheckCircle size={13} /> Authorized & Enabled
          </div>
        </div>

        <div className="maritime-card" style={{ padding: '18px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Pending Approvals</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: '#d97706', marginTop: '4px' }}>{pendingCount}</div>
          <div style={{ fontSize: '12px', color: '#b45309', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <UserCheck size={13} /> Require Verification
          </div>
        </div>

        <div className="maritime-card" style={{ padding: '18px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Deactivated / Suspicious</div>
          <div style={{ fontSize: '26px', fontWeight: 800, color: (inactiveCount + suspiciousCount) > 0 ? '#ef4444' : '#64748b', marginTop: '4px' }}>
            {inactiveCount} <span style={{ fontSize: '14px', fontWeight: 600, color: '#64748b' }}>({suspiciousCount} flagged)</span>
          </div>
          <div style={{ fontSize: '12px', color: '#dc2626', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={13} /> Restricted Access
          </div>
        </div>
      </div>

      {/* Pending Officer Registration Approvals Card */}
      {pendingUsers.length > 0 && (
        <div className="maritime-card" style={{ padding: '24px', marginBottom: '28px', border: '2px solid #fde68a', background: '#fffbeb' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserCheck size={20} color="#d97706" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#92400e' }}>
                  Pending Officer Registration Approvals ({pendingUsers.length})
                </h3>
                <div style={{ fontSize: '12px', color: '#b45309' }}>
                  High-privilege maritime roles (Ship Manager, Port Manager, Inspector) require Admin authorization
                </div>
              </div>
            </div>
            <span className="badge badge-amber" style={{ fontSize: '12px', padding: '4px 10px' }}>
              Action Required
            </span>
          </div>

          <div style={{ overflowX: 'auto', background: '#ffffff', borderRadius: '8px', border: '1px solid #fef3c7' }}>
            <table className="maritime-table">
              <thead>
                <tr>
                  <th>Applicant Officer</th>
                  <th>Email</th>
                  <th>Requested Role</th>
                  <th>Station / Port</th>
                  <th>Department</th>
                  <th>Admin Decision</th>
                </tr>
              </thead>
              <tbody>
                {pendingUsers.map((pu) => (
                  <tr key={pu._id || pu.userId}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{pu.name}</div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>Registered: {new Date(pu.createdAt || Date.now()).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <code style={{ color: '#0284c7' }}>{pu.email}</code>
                    </td>
                    <td>
                      <span className={`badge ${
                        pu.role === 'port_manager' ? 'badge-cyan' :
                        pu.role === 'ship_manager' ? 'badge-blue' :
                        pu.role === 'inspector' ? 'badge-amber' : 'badge-purple'
                      }`}>
                        {pu.role?.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>{pu.assignedPort || 'Mumbai Port'}</td>
                    <td>{pu.department || 'Maritime Operations'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => handleApproval(pu.userId || pu._id, 'approve')}
                          className="btn btn-secondary btn-sm"
                          style={{ borderColor: '#86efac', color: '#15803d', fontWeight: 700, background: '#f0fdf4' }}
                        >
                          <Check size={14} color="#15803d" />
                          <span>Approve</span>
                        </button>
                        <button
                          onClick={() => handleApproval(pu.userId || pu._id, 'reject')}
                          className="btn btn-outline btn-sm"
                          style={{ borderColor: '#fca5a5', color: '#dc2626', fontWeight: 700, background: '#fef2f2' }}
                        >
                          <X size={14} color="#dc2626" />
                          <span>Reject</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Directory & Management Card */}
      <div className="maritime-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
              Officer & User Directory
            </h3>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Full system accounts list with RBAC privileges, activation controls, and password recovery tools
            </div>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
              <input
                type="text"
                placeholder="Search user, email, port..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-control"
                style={{ paddingLeft: '32px', width: '220px', fontSize: '12px' }}
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="select-control"
              style={{ width: 'auto', fontSize: '12px' }}
            >
              <option value="All">All Roles</option>
              <option value="admin">Admin</option>
              <option value="port_manager">Port Manager</option>
              <option value="ship_manager">Ship Manager</option>
              <option value="inspector">Inspector</option>
              <option value="viewer">Viewer</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="select-control"
              style={{ width: 'auto', fontSize: '12px' }}
            >
              <option value="All">All Statuses</option>
              <option value="active">Active Only</option>
              <option value="inactive">Deactivated Only</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: '10px', color: 'var(--cyan)' }} />
            <div>Loading verified user directory...</div>
          </div>
        ) : users.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#f8fafc', borderRadius: '10px', color: '#64748b' }}>
            No accounts matched your search criteria. Try adjusting the filters.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="maritime-table">
              <thead>
                <tr>
                  <th>Officer Profile</th>
                  <th>Email & ID</th>
                  <th>Station / Vessel</th>
                  <th>Assigned Role</th>
                  <th>Status & Security</th>
                  <th style={{ textAlign: 'right' }}>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isDeactivated = u.isActive === false;
                  const hasFailedLogins = (u.failedLoginAttempts || 0) > 0;
                  const isSelf = u.userId === currentUser?.userId;

                  return (
                    <tr key={u.userId || u._id} style={{ opacity: isDeactivated ? 0.75 : 1, background: isDeactivated ? '#fafafa' : 'inherit' }}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img
                            src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                            alt={u.name}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: isDeactivated ? '2px solid #cbd5e1' : '2px solid #0284c7' }}
                          />
                          <div>
                            <div style={{ fontWeight: 700, color: isDeactivated ? '#64748b' : '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span>{u.name}</span>
                              {isSelf && <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', padding: '1px 6px', borderRadius: '4px' }}>YOU</span>}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.department || 'Operations'}</div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#0284c7' }}>{u.email}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}>ID: {u.userId || u._id?.substring(0, 8)}</div>
                      </td>

                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{u.assignedPort || 'Global Port'}</div>
                        {u.assignedShipId && (
                          <div style={{ fontSize: '11px', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                            <Ship size={11} /> Vessel: {u.assignedShipId}
                          </div>
                        )}
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <select
                            className="select-control"
                            style={{
                              width: 'auto',
                              fontSize: '12px',
                              padding: '4px 8px',
                              fontWeight: 700,
                              borderColor: u.role === 'admin' ? '#c084fc' : u.role === 'port_manager' ? '#38bdf8' : '#e2e8f0'
                            }}
                            value={u.role}
                            disabled={isSelf}
                            onChange={(e) => handleRoleChange(u.userId || u._id, e.target.value)}
                          >
                            <option value="admin">Admin</option>
                            <option value="port_manager">Port Manager</option>
                            <option value="ship_manager">Ship Manager</option>
                            <option value="inspector">Inspector</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {isDeactivated ? (
                            <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                              <UserX size={11} /> Deactivated
                            </span>
                          ) : (
                            <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', width: 'fit-content' }}>
                              <CheckCircle size={11} /> Active
                            </span>
                          )}

                          {hasFailedLogins && (
                            <span style={{ fontSize: '10px', color: '#b91c1c', background: '#fee2e2', padding: '1px 6px', borderRadius: '4px', width: 'fit-content', fontWeight: 600 }}>
                              ⚠️ {u.failedLoginAttempts} failed login attempt(s)
                            </span>
                          )}
                        </div>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          {/* Toggle Active / Deactivate */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            disabled={isSelf}
                            title={isDeactivated ? 'Activate Account' : 'Deactivate Account'}
                            className={`btn btn-sm ${isDeactivated ? 'btn-secondary' : 'btn-outline'}`}
                            style={{
                              padding: '4px 8px',
                              fontSize: '11px',
                              borderColor: isDeactivated ? '#86efac' : '#cbd5e1',
                              color: isDeactivated ? '#15803d' : '#64748b'
                            }}
                          >
                            {isDeactivated ? <UserCheck size={13} /> : <UserX size={13} />}
                            <span>{isDeactivated ? 'Activate' : 'Deactivate'}</span>
                          </button>

                          {/* Reset Password */}
                          <button
                            onClick={() => {
                              setResetModalUser(u);
                              setNewPasswordInput('');
                            }}
                            title="Reset Officer Password"
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px', color: '#0284c7', borderColor: '#bae6fd' }}
                          >
                            <Key size={13} />
                            <span>Reset Pwd</span>
                          </button>

                          {/* Delete Account */}
                          <button
                            onClick={() => setDeleteModalUser(u)}
                            disabled={isSelf}
                            title="Delete User Account"
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px', fontSize: '11px', color: '#dc2626', borderColor: '#fca5a5' }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Permission Matrix Card */}
      <div className="maritime-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 700 }}>
          System Role Permissions Matrix (RBAC)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="maritime-table">
            <thead>
              <tr>
                <th>Role Tier</th>
                <th>Target Responsibilities</th>
                <th>Vessels & Fleet</th>
                <th>Containers</th>
                <th>Inspections</th>
                <th>Audit & Hashes</th>
                <th>Admin Control</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge badge-purple">Admin</span></td>
                <td>Full System Supervision, User Governance & Security</td>
                <td><span style={{ color: '#10b981', fontWeight: 700 }}>✓ Full</span></td>
                <td><span style={{ color: '#10b981', fontWeight: 700 }}>✓ Full</span></td>
                <td><span style={{ color: '#10b981', fontWeight: 700 }}>✓ Full</span></td>
                <td><span style={{ color: '#10b981', fontWeight: 700 }}>✓ Full + Tamper Test</span></td>
                <td><span style={{ color: '#10b981', fontWeight: 700 }}>✓ Full</span></td>
              </tr>
              <tr>
                <td><span className="badge badge-cyan">Port Manager</span></td>
                <td>Terminal & Quay Loading/Unloading, Berths & Gates</td>
                <td><span style={{ color: '#10b981' }}>✓ Edit/Status</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Book/Transition</span></td>
                <td><span style={{ color: '#10b981' }}>✓ View/Attach</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Verify</span></td>
                <td><span style={{ color: 'var(--text-muted)' }}>✗ None</span></td>
              </tr>
              <tr>
                <td><span className="badge badge-blue">Ship Manager</span></td>
                <td>Assigned Vessel Voyage Operations, ETA & Navigation</td>
                <td><span style={{ color: '#10b981' }}>✓ Assigned Ship</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Onboard Manifest</span></td>
                <td><span style={{ color: 'var(--text-muted)' }}>✗ View Only</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Verify</span></td>
                <td><span style={{ color: 'var(--text-muted)' }}>✗ None</span></td>
              </tr>
              <tr>
                <td><span className="badge badge-amber">Inspector</span></td>
                <td>Customs, Physical Condition, Seals & Evidence Signing</td>
                <td><span style={{ color: 'var(--text-muted)' }}>✗ View Only</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Inspect/Flag</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Sign Pass/Fail</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Verify</span></td>
                <td><span style={{ color: 'var(--text-muted)' }}>✗ None</span></td>
              </tr>
              <tr>
                <td><span className="badge badge-green">Viewer</span></td>
                <td>Auditor, Client & Observer Read-Only</td>
                <td><span style={{ color: 'var(--text-muted)' }}>✗ Read Only</span></td>
                <td><span style={{ color: 'var(--text-muted)' }}>✗ Read Only</span></td>
                <td><span style={{ color: 'var(--text-muted)' }}>✗ Read Only</span></td>
                <td><span style={{ color: 'var(--text-muted)' }}>✗ Read Only</span></td>
                <td><span style={{ color: 'var(--text-muted)' }}>✗ None</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE NEW OFFICER MODAL */}
      {showCreateModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="maritime-card" style={{ width: '100%', maxWidth: '520px', padding: '28px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UserPlus size={20} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>Create Officer Account</h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Provision a new maritime official with instant access & RBAC role</div>
                </div>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={createFormData.name}
                    onChange={(e) => setCreateFormData({ ...createFormData, name: e.target.value })}
                    className="input-control"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="officer@maritime.gov.in"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    className="input-control"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Minimum 6 characters"
                    value={createFormData.password}
                    onChange={(e) => setCreateFormData({ ...createFormData, password: e.target.value })}
                    className="input-control"
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Assigned Role *
                    </label>
                    <select
                      value={createFormData.role}
                      onChange={(e) => setCreateFormData({ ...createFormData, role: e.target.value })}
                      className="select-control"
                      style={{ width: '100%' }}
                    >
                      <option value="port_manager">Port Manager</option>
                      <option value="ship_manager">Ship Manager</option>
                      <option value="inspector">Inspector</option>
                      <option value="viewer">Viewer</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Station / Port *
                    </label>
                    <select
                      value={createFormData.assignedPort}
                      onChange={(e) => setCreateFormData({ ...createFormData, assignedPort: e.target.value })}
                      className="select-control"
                      style={{ width: '100%' }}
                    >
                      <option value="Mumbai Port">Mumbai Port</option>
                      <option value="Chennai Port">Chennai Port</option>
                      <option value="Kolkata Port">Kolkata Port</option>
                      <option value="Jawaharlal Nehru Port">Jawaharlal Nehru Port</option>
                      <option value="Cochin Port">Cochin Port</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Department
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Quay & Berthing Logistics"
                      value={createFormData.department}
                      onChange={(e) => setCreateFormData({ ...createFormData, department: e.target.value })}
                      className="input-control"
                      style={{ width: '100%' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                      Assigned Vessel (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. SHIP-001 (INS Sagar)"
                      value={createFormData.assignedShipId}
                      onChange={(e) => setCreateFormData({ ...createFormData, assignedShipId: e.target.value })}
                      className="input-control"
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="btn btn-primary"
                  style={{ fontWeight: 700 }}
                >
                  {createSubmitting ? 'Creating Officer...' : 'Create & Activate Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="maritime-card" style={{ width: '100%', maxWidth: '440px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Key size={18} color="#0284c7" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>Reset Officer Password</h3>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Account: {resetModalUser.name} ({resetModalUser.email})</div>
                </div>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#94a3b8' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminResetPassword}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '4px' }}>
                  New Temporary Password (or leave blank for "password123")
                </label>
                <input
                  type="text"
                  placeholder="password123"
                  value={newPasswordInput}
                  onChange={(e) => setNewPasswordInput(e.target.value)}
                  className="input-control"
                  style={{ width: '100%' }}
                />
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                  This action will clear any lockouts and log a cryptographic audit event.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="btn btn-outline btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="btn btn-primary btn-sm"
                  style={{ fontWeight: 700 }}
                >
                  {resetSubmitting ? 'Resetting...' : 'Confirm Reset Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE USER CONFIRMATION MODAL */}
      {deleteModalUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="maritime-card" style={{ width: '100%', maxWidth: '440px', padding: '24px', border: '2px solid #fecaca' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={22} color="#dc2626" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#991b1b' }}>Delete User Account</h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>Irreversible Administrative Action</div>
              </div>
            </div>

            <p style={{ fontSize: '13px', color: '#334155', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Are you sure you want to permanently delete the account for <strong>{deleteModalUser.name}</strong> (<code>{deleteModalUser.email}</code>)?
              This will revoke all system credentials and record an immutable audit entry.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setDeleteModalUser(null)}
                className="btn btn-outline btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={handleDeleteUser}
                className="btn btn-primary btn-sm"
                style={{ background: '#dc2626', borderColor: '#dc2626', fontWeight: 700 }}
              >
                {deleteSubmitting ? 'Deleting Account...' : 'Yes, Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
