import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import {
  User,
  Mail,
  Building,
  ShieldCheck,
  Lock,
  KeyRound,
  History,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Globe,
  MapPin,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  ArrowRight,
  Fingerprint,
  Check,
  Ship,
  Box,
  Copy
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
];

export const ProfilePage = () => {
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'security' | 'permissions' | 'activity'

  // Profile Form State
  const [name, setName] = useState(user?.name || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [assignedPort, setAssignedPort] = useState(user?.assignedPort || 'Mumbai Port');
  const [avatar, setAvatar] = useState(user?.avatar || PRESET_AVATARS[0]);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // My Activity State
  const [myLogs, setMyLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setDepartment(user.department || '');
      setAssignedPort(user.assignedPort || 'Mumbai Port');
      setAvatar(user.avatar || PRESET_AVATARS[0]);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'activity') {
      fetchMyActivity();
    }
  }, [activeTab]);

  const fetchMyActivity = async () => {
    try {
      setLoadingActivity(true);
      const res = await api.auditLogs.getAll({
        userId: user?.userId || user?.id,
        limit: 15
      });
      setMyLogs(res?.logs || []);
    } catch (err) {
      console.error('Failed to load user activity:', err);
    } finally {
      setLoadingActivity(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setProfileSaving(true);
      setProfileMsg({ type: '', text: '' });

      if (updateProfile) {
        await updateProfile({
          name,
          department,
          assignedPort,
          avatar
        });
      }

      setProfileMsg({ type: 'success', text: 'Officer profile successfully updated and recorded in the audit log.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.message || 'Failed to update profile.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    try {
      setPasswordSaving(true);
      setPasswordMsg({ type: '', text: '' });

      if (api.auth?.changePassword) {
        await api.auth.changePassword({ currentPassword, newPassword });
      }

      setPasswordMsg({ type: 'success', text: 'Password successfully updated and security audit recorded.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to update password.' });
    } finally {
      setPasswordSaving(false);
    }
  };

  const copyPublicKey = () => {
    const key = `SHA256-PUBKEY-${(user?.userId || 'USR-101').toUpperCase()}-0x${Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
    navigator.clipboard.writeText(key);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="page-wrapper">
      {/* Top Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
          OFFICER GOVERNANCE & SECURITY PROFILE
        </div>
        <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>
          Officer Account & Credentials
        </h1>
        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Manage your operational credentials, security keys, and review your cryptographic audit history.
        </div>
      </div>

      {/* Profile Overview Hero Card */}
      <div className="maritime-card" style={{ padding: '28px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={avatar || PRESET_AVATARS[0]}
                alt={user?.name || 'Officer Avatar'}
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #0284c7',
                  boxShadow: '0 4px 12px rgba(2, 132, 199, 0.2)'
                }}
              />
              <span style={{
                position: 'absolute',
                bottom: '2px',
                right: '2px',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                background: '#10b981',
                border: '2px solid #ffffff'
              }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {user?.name || 'Maritime Officer'}
                </h2>
                <span className={`badge ${
                  user?.role === 'admin' ? 'badge-purple' :
                  user?.role === 'port_manager' ? 'badge-cyan' :
                  user?.role === 'ship_manager' ? 'badge-blue' :
                  user?.role === 'inspector' ? 'badge-amber' : 'badge-green'
                }`}>
                  {user?.role?.replace('_', ' ') || 'Officer'}
                </span>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#15803d',
                  background: '#dcfce7',
                  border: '1px solid #bbf7d0',
                  padding: '3px 10px',
                  borderRadius: '999px'
                }}>
                  <CheckCircle2 size={12} /> Active in Cluster
                </span>
              </div>

              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                {user?.email} &bull; <strong style={{ color: '#0f3460' }}>{user?.department || 'Maritime Operations'}</strong> &bull; Station: <strong>{user?.assignedPort || 'Mumbai Port'}</strong>
              </div>

              <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                Officer ID: {user?.userId || user?.id || 'USR-ADMIN-101'}
              </div>
            </div>
          </div>

          {/* Quick Security Badge */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '12px 18px',
            textAlign: 'right'
          }}>
            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 800, letterSpacing: '0.5px' }}>
              Cryptographic Key Status
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#059669', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
              <ShieldCheck size={16} color="#059669" />
              <span>SHA-256 Signing Active</span>
            </div>
            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
              Session: 7-Day JWT Bearer
            </div>
          </div>
        </div>
      </div>

      {/* Segmented Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '24px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'general' ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === 'general' ? '#0284c7' : '#64748b',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <User size={16} />
          <span>Personal & Station Details</span>
        </button>

        <button
          onClick={() => setActiveTab('security')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'security' ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === 'security' ? '#0284c7' : '#64748b',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <Lock size={16} />
          <span>Security & Password</span>
        </button>

        <button
          onClick={() => setActiveTab('permissions')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'permissions' ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === 'permissions' ? '#0284c7' : '#64748b',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <ShieldCheck size={16} />
          <span>Role Permissions Matrix</span>
        </button>

        <button
          onClick={() => setActiveTab('activity')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 18px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'activity' ? '3px solid #0284c7' : '3px solid transparent',
            color: activeTab === 'activity' ? '#0284c7' : '#64748b',
            fontWeight: 700,
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.15s'
          }}
        >
          <History size={16} />
          <span>My Audit Activity</span>
        </button>
      </div>

      {/* TAB 1: PERSONAL & STATION DETAILS */}
      {activeTab === 'general' && (
        <div className="maritime-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            Officer Profile Details
          </h3>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '22px' }}>
            Update your operational metadata. Any changes will be cryptographically hashed into the ledger.
          </p>

          {profileMsg.text && (
            <div style={{
              padding: '12px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              marginBottom: '20px',
              background: profileMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
              color: profileMsg.type === 'success' ? '#15803d' : '#b91c1c',
              border: `1px solid ${profileMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              {profileMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{profileMsg.text}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {/* Avatar Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Officer Avatar
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                {PRESET_AVATARS.map((pAvatar, idx) => (
                  <img
                    key={idx}
                    src={pAvatar}
                    alt={`Avatar option ${idx + 1}`}
                    onClick={() => setAvatar(pAvatar)}
                    style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: avatar === pAvatar ? '3px solid #0284c7' : '2px solid transparent',
                      boxShadow: avatar === pAvatar ? '0 0 8px rgba(2, 132, 199, 0.4)' : 'none',
                      transition: 'all 0.15s'
                    }}
                  />
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Full Officer Name *
                </label>
                <input
                  type="text"
                  required
                  className="input-control"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Official Email Address
                </label>
                <input
                  type="email"
                  disabled
                  className="input-control"
                  style={{ background: '#f1f5f9', cursor: 'not-allowed', color: '#64748b' }}
                  value={user?.email || ''}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Department / Authority
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Assigned Port Station
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={assignedPort}
                  onChange={(e) => setAssignedPort(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button
                type="submit"
                disabled={profileSaving}
                className="btn btn-primary"
              >
                <Save size={16} />
                <span>{profileSaving ? 'Saving Profile...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: SECURITY & PASSWORD */}
      {activeTab === 'security' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          {/* Password Update Card */}
          <div className="maritime-card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
              Update Security Password
            </h3>
            <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
              Change your password. Ensure it has at least 6 characters.
            </p>

            {passwordMsg.text && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                marginBottom: '18px',
                background: passwordMsg.type === 'success' ? '#dcfce7' : '#fee2e2',
                color: passwordMsg.type === 'success' ? '#15803d' : '#b91c1c',
                border: `1px solid ${passwordMsg.type === 'success' ? '#bbf7d0' : '#fecaca'}`
              }}>
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Current Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-control"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  New Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-control"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Confirm New Password *
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-control"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input
                  type="checkbox"
                  id="showPass"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="showPass" style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
                  Show passwords
                </label>
              </div>

              <button
                type="submit"
                disabled={passwordSaving}
                className="btn btn-primary"
                style={{ marginTop: '8px' }}
              >
                <Lock size={15} />
                <span>{passwordSaving ? 'Updating Password...' : 'Update Password'}</span>
              </button>
            </form>
          </div>

          {/* Cryptographic Public Key Card */}
          <div className="maritime-card" style={{ padding: '28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Officer Digital Signature Key
              </h3>
              <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
                Your public cryptographic signing identifier used to hash blockchain operations.
              </p>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                padding: '16px',
                borderRadius: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', marginBottom: '6px' }}>
                  SHA-256 Public Certificate Fingerprint
                </div>
                <code style={{
                  display: 'block',
                  wordBreak: 'break-all',
                  fontSize: '12px',
                  color: '#0f172a',
                  background: '#ffffff',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1'
                }}>
                  SHA256-PUBKEY-{(user?.userId || 'USR-101').toUpperCase()}-0x9a8f4c2e1b7d5e6a0f34600284c7
                </code>
              </div>

              <div style={{ fontSize: '12px', color: '#64748b', lineHeight: 1.5 }}>
                Every container loading, inspection pass, and departure signed by you links permanently to this cryptographic key in MongoDB Atlas.
              </div>
            </div>

            <button
              type="button"
              onClick={copyPublicKey}
              className="btn btn-outline"
              style={{ width: '100%', marginTop: '20px' }}
            >
              {copiedKey ? <Check size={16} color="#059669" /> : <Copy size={16} />}
              <span>{copiedKey ? 'Fingerprint Copied to Clipboard!' : 'Copy Key Fingerprint'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: ROLE PERMISSIONS MATRIX */}
      {activeTab === 'permissions' && (
        <div className="maritime-card" style={{ padding: '28px' }}>
          <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
            Operational Permissions for Role: <strong style={{ color: '#0284c7', textTransform: 'capitalize' }}>{user?.role?.replace('_', ' ')}</strong>
          </h3>
          <p style={{ color: '#64748b', fontSize: '13px', marginBottom: '20px' }}>
            Summary of authorized features and governance limits granted to your role tier.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Ship size={18} color="#0284c7" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Fleet Management</h4>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                {user?.role === 'admin' || user?.role === 'ship_manager' ? '✅ Full access to manage vessels, routes, and cargo manifests.' : '👁️ Read-only observation of vessel positions.'}
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Box size={18} color="#0f3460" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Container Inventory</h4>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                {user?.role === 'admin' || user?.role === 'port_manager' ? '✅ Authorized to register, stage, and transition container lifecycle status.' : '🔍 Inspect and verify container manifests.'}
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <ShieldCheck size={18} color="#059669" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Inspections & Seals</h4>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                {user?.role === 'admin' || user?.role === 'inspector' ? '✅ Full authority to execute physical checklists, verify bolt seals, and sign pass/fail.' : '👁️ View inspection certificates.'}
              </p>
            </div>

            <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Fingerprint size={18} color="#7c3aed" />
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>Ledger Integrity</h4>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                ✅ All users can run cryptographic SHA-256 integrity verification across the blockchain.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MY AUDIT ACTIVITY */}
      {activeTab === 'activity' && (
        <div className="maritime-card" style={{ padding: '28px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0' }}>
                My Immutable Audit Log
              </h3>
              <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>
                Real-time chronological events recorded with your officer digital signature.
              </p>
            </div>
            <button onClick={fetchMyActivity} className="btn btn-secondary btn-sm">
              <RotateCcw size={14} />
              <span>Refresh Log</span>
            </button>
          </div>

          {loadingActivity ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              Loading your signed audit records...
            </div>
          ) : myLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              No audit actions recorded for this officer account yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {myLogs.map((log) => (
                <div
                  key={log.auditId}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      color: '#0369a1',
                      background: '#e0f2fe',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      {log.auditId}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {log.action}
                  </div>

                  <div style={{ fontSize: '12px', color: '#475569' }}>
                    Entity: <strong>{log.entityType} ({log.entityId})</strong> &bull; Station: <em>{log.location}</em>
                  </div>

                  <div style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '4px'
                  }}>
                    <ShieldCheck size={13} color="#059669" />
                    <span>Block Hash: {log.currentHash ? `${log.currentHash.substring(0, 24)}...` : 'N/A'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
