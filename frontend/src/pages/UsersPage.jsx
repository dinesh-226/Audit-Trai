import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  Shield,
  Key,
  CheckCircle,
  UserCheck,
  RotateCcw,
  ExternalLink
} from 'lucide-react';

export const UsersPage = () => {
  const [demoUsers, setDemoUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.auth.getDemoUsers();
      setDemoUsers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.auth.updateUserRole(userId, newRole);
      await fetchUsers();
    } catch (e) {
      alert(`Error updating user role: ${e.message}`);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            ACCESS CONTROL & SECURITY PERMISSIONS
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Role-Based Access Control (RBAC) & Users
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Manage maritime accounts, port allocations, vessel assignments, and role permissions
          </div>
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="maritime-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '16px', fontWeight: 700 }}>
          System Role Permissions Matrix
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="maritime-table">
            <thead>
              <tr>
                <th>Role Tier</th>
                <th>Target Responsibilities</th>
                <th>Vessels & Ships</th>
                <th>Containers</th>
                <th>Inspections</th>
                <th>Audit & Hashes</th>
                <th>Admin Control</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="badge badge-purple">Admin</span></td>
                <td>Full System Access, Security Governance</td>
                <td><span style={{ color: '#10b981' }}>✓ Full</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Full</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Full</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Full + Tamper Test</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Full</span></td>
              </tr>
              <tr>
                <td><span className="badge badge-cyan">Port Manager</span></td>
                <td>Terminal & Quay Loading/Unloading</td>
                <td><span style={{ color: '#10b981' }}>✓ Edit/Status</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Book/Transition</span></td>
                <td><span style={{ color: '#10b981' }}>✓ View/Attach</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Verify</span></td>
                <td><span style={{ color: 'var(--text-muted)' }}>✗ None</span></td>
              </tr>
              <tr>
                <td><span className="badge badge-blue">Ship Manager</span></td>
                <td>Assigned Vessel Voyage Operations</td>
                <td><span style={{ color: '#10b981' }}>✓ Assigned Ship</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Onboard Manifest</span></td>
                <td><span style={{ color: 'var(--text-muted)' }}>✗ View Only</span></td>
                <td><span style={{ color: '#10b981' }}>✓ Verify</span></td>
                <td><span style={{ color: 'var(--text-muted)' }}>✗ None</span></td>
              </tr>
              <tr>
                <td><span className="badge badge-amber">Inspector</span></td>
                <td>Customs, Safety & Bolt Seal Checks</td>
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

      {/* User Accounts Table */}
      <div className="maritime-card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>
          Active Maritime User Accounts
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading user directory...
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="maritime-table">
              <thead>
                <tr>
                  <th>User / Department</th>
                  <th>Email</th>
                  <th>Assigned Port / Vessel</th>
                  <th>Active Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {demoUsers.map((u) => (
                  <tr key={u.userId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img
                          src={u.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                          alt={u.name}
                          style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{u.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{u.department}</div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <code style={{ color: 'var(--cyan)' }}>{u.email}</code>
                    </td>

                    <td>
                      <div style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
                        {u.assignedPort} {u.assignedShipId ? `&bull; Vessel: ${u.assignedShipId}` : ''}
                      </div>
                    </td>

                    <td>
                      <span className={`badge ${
                        u.role === 'admin' ? 'badge-purple' :
                        u.role === 'port_manager' ? 'badge-cyan' :
                        u.role === 'ship_manager' ? 'badge-blue' :
                        u.role === 'inspector' ? 'badge-amber' : 'badge-green'
                      }`}>
                        {u.role.replace('_', ' ')}
                      </span>
                    </td>

                    <td>
                      <select
                        className="select-control"
                        style={{ width: 'auto', fontSize: '12px', padding: '4px 8px' }}
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.userId, e.target.value)}
                      >
                        <option value="admin">Admin</option>
                        <option value="port_manager">Port Manager</option>
                        <option value="ship_manager">Ship Manager</option>
                        <option value="inspector">Inspector</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
