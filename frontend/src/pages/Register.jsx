import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Anchor,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Ship,
  Sparkles,
  Award,
  CheckCircle2
} from 'lucide-react';

export const Register = ({ onBackToHome, onGoToLogin, onSuccess }) => {
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('inspector');
  const [department, setDepartment] = useState('Maritime Customs & Safety');
  const [assignedPort, setAssignedPort] = useState('Mumbai Port');
  const [agreeTerms, setAgreeTerms] = useState(true);

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [registeredPendingUser, setRegisteredPendingUser] = useState(null);

  const roleDescriptions = {
    admin: '👑 Admin: Highest level of access. Manages users, changes roles, views complete audit trail, verifies system integrity, monitors security, and generates reports.',
    port_manager: '⚓ Port Manager: Focuses on port activities. Monitors containers, loading/unloading operations, yard logistics, gate entry/exit, and ship berths. (Requires Admin Approval)',
    ship_manager: '🚢 Ship Manager: Focuses on vessels and voyages. Monitors ship location, AIS speed, routes, onboard container manifests, voyage details, and estimated arrival (ETA). (Requires Admin Approval)',
    inspector: '🔍 Inspector: Checks physical condition & security of containers. Verifies seals, conducts inspections, uploads photos, completes checklists, and marks Pass/Fail. (Requires Admin Approval)',
    viewer: '👁️ Viewer: Read-only access. Instant access without approval! Can view records, verify audit trail integrity, inspect container details, and generate reports.'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify both password entries.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (!agreeTerms) {
      setError('You must accept the Maritime Data Governance & Audit terms.');
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        name,
        email,
        password,
        role,
        department,
        assignedPort
      });

      if (res?.requiresApproval || res?.user?.approvalStatus === 'pending') {
        setRegisteredPendingUser(res.user || { name, email, role, department, assignedPort });
      } else {
        if (onSuccess) onSuccess(res?.user);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your information.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      color: '#0f172a'
    }}>
      {/* Top Navigation Bar */}
      <header style={{
        height: '64px',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0'
      }}>
        {onBackToHome ? (
          <button
            onClick={onBackToHome}
            className="btn btn-secondary btn-sm"
            style={{ fontWeight: 600 }}
          >
            <ArrowLeft size={14} />
            <span>Back to Landing Page</span>
          </button>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Anchor size={20} color="#0f3460" />
            <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f3460' }}>CONTAINERSHIP AUDIT</span>
          </div>
        )}

        <div style={{ fontSize: '13px', color: '#64748b' }}>
          Already have an officer account?{' '}
          <button
            onClick={onGoToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#0284c7',
              fontWeight: 700,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              marginLeft: '4px'
            }}
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'stretch',
        maxWidth: '1280px',
        width: '100%',
        margin: '24px auto',
        padding: '0 24px',
        gap: '32px'
      }}>
        {/* Left Side: Role Tiers & Governance Summary */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, #0f3460 0%, #16213e 50%, #0369a1 100%)',
          borderRadius: '20px',
          padding: '44px 36px',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          boxShadow: '0 10px 25px -5px rgba(15, 52, 96, 0.3)'
        }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 800,
              letterSpacing: '0.8px',
              marginBottom: '24px'
            }}>
              <Award size={14} color="#86efac" />
              <span>MARITIME OPERATOR REGISTRATION</span>
            </div>

            <h2 style={{
              fontSize: '30px',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '14px',
              letterSpacing: '-0.5px'
            }}>
              Join the Cryptographic Audit Network
            </h2>

            <p style={{ fontSize: '14px', color: '#e2e8f0', lineHeight: 1.6, marginBottom: '28px' }}>
              Register your credentials to record vessel voyages, inspect containers, sign cryptographic compliance milestones, and manage operational risk.
            </p>

            {/* Role Breakdown List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '12px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#38bdf8' }}>⚓ Port & Terminal Manager</span>
                  <span style={{ fontSize: '10px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>OPERATIONS</span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Direct berth assignments, container loading, and quay staging.</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '12px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#a78bfa' }}>🚢 Ship Master & Fleet Manager</span>
                  <span style={{ fontSize: '10px', background: 'rgba(167, 139, 250, 0.2)', color: '#a78bfa', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>NAVIGATION</span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Vessel AIS tracking, transit telemetry, and container manifests.</div>
              </div>

              <div style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '12px',
                padding: '12px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 800, fontSize: '13px', color: '#fde047' }}>🔍 Customs & Safety Inspector</span>
                  <span style={{ fontSize: '10px', background: 'rgba(253, 224, 71, 0.2)', color: '#fde047', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>COMPLIANCE</span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1' }}>Verify bolt seals, conduct safety audits, and stamp certificates.</div>
              </div>
            </div>
          </div>

          <div style={{
            paddingTop: '20px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            fontSize: '11px',
            color: '#cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>ALL REGISTRATIONS SEALED WITH SHA-256</span>
            <span>IMO / ISPS COMPLIANT</span>
          </div>
        </div>

        {/* Right Side: Registration Form or Pending Approval Screen */}
        <div style={{
          flex: 1.2,
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {registeredPendingUser ? (
            <div>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#fef3c7',
                border: '2px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}>
                <ShieldCheck size={28} color="#d97706" />
              </div>

              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                color: '#92400e',
                fontSize: '11px',
                fontWeight: 800,
                padding: '4px 10px',
                borderRadius: '999px',
                marginBottom: '12px'
              }}>
                <span>PENDING ADMIN APPROVAL</span>
              </div>

              <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0', letterSpacing: '-0.4px' }}>
                Officer Application Submitted!
              </h2>

              <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.6, marginBottom: '20px' }}>
                Thank you, <strong>{registeredPendingUser.name}</strong>. Your registration for privileged role{' '}
                <strong style={{ color: '#0369a1' }}>{registeredPendingUser.role?.replace('_', ' ').toUpperCase()}</strong> has been recorded on the SHA-256 ledger.
              </p>

              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#64748b' }}>Officer Email:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{registeredPendingUser.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#64748b' }}>Station / Port:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{registeredPendingUser.assignedPort}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#64748b' }}>Department:</span>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{registeredPendingUser.department}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                  <span style={{ color: '#64748b' }}>Security Status:</span>
                  <span style={{ fontWeight: 700, color: '#d97706' }}>Awaiting Admin Authorization</span>
                </div>
              </div>

              <div style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '12px',
                fontSize: '12px',
                color: '#1e40af',
                marginBottom: '24px',
                lineHeight: 1.5
              }}>
                <strong>Maritime RBAC Policy:</strong> To protect port assets and vessel logs, privileged officer accounts (Ship Manager, Port Manager, Inspector) require one-time approval by the System Administrator (Capt. Rajesh Menon). Viewers can access instantly without approval.
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onGoToLogin}
                  className="btn btn-primary"
                  style={{ flex: 1, padding: '12px', fontWeight: 700 }}
                >
                  <ArrowRight size={16} />
                  <span>Return to Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setRegisteredPendingUser(null);
                    setRole('viewer');
                  }}
                  className="btn btn-secondary"
                  style={{ flex: 1, padding: '12px', fontWeight: 700 }}
                >
                  <span>Register as Viewer</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{ marginBottom: '22px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
                  Create Officer Account
                </h1>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Enter your officer details and select your assigned operational authority.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div style={{
                  background: '#fee2e2',
                  color: '#b91c1c',
                  border: '1px solid #fecaca',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    style={{ background: 'none', border: 'none', color: '#b91c1c', cursor: 'pointer', fontWeight: 700 }}
                  >
                    ✕
                  </button>
                </div>
              )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Full Name & Email Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Full Officer Name *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    className="input-control"
                    style={{ paddingLeft: '36px' }}
                    placeholder="e.g. Officer Sunita Rao"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  <User size={15} color="#64748b" style={{ position: 'absolute', left: '11px', top: '12px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Official Email Address *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    required
                    className="input-control"
                    style={{ paddingLeft: '36px' }}
                    placeholder="name@auditflow.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail size={15} color="#64748b" style={{ position: 'absolute', left: '11px', top: '12px' }} />
                </div>
              </div>
            </div>

            {/* Role & Assigned Port Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Role Tier *
                </label>
                <select
                  className="select-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  style={{ fontWeight: 600 }}
                >
                  <option value="inspector">🔍 Inspector (Customs & Seals)</option>
                  <option value="port_manager">⚓ Port Manager (Terminal)</option>
                  <option value="ship_manager">🚢 Ship Manager (Vessel)</option>
                  <option value="viewer">👁️ Viewer (Read Only)</option>
                  <option value="admin">👑 Admin (Full Access)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Assigned Port Station *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    required
                    className="input-control"
                    style={{ paddingLeft: '36px' }}
                    placeholder="e.g. Mumbai Port"
                    value={assignedPort}
                    onChange={(e) => setAssignedPort(e.target.value)}
                  />
                  <MapPin size={15} color="#64748b" style={{ position: 'absolute', left: '11px', top: '12px' }} />
                </div>
              </div>
            </div>

            {/* Role Helper Banner */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '8px 12px',
              fontSize: '11px',
              color: '#475569'
            }}>
              <strong style={{ color: '#0f3460' }}>Permission Scope:</strong> {roleDescriptions[role]}
            </div>

            {/* Department */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Department / Operational Authority *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  className="input-control"
                  style={{ paddingLeft: '36px' }}
                  placeholder="e.g. Terminal Operations & Cargo Security"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
                <Building size={15} color="#64748b" style={{ position: 'absolute', left: '11px', top: '12px' }} />
              </div>
            </div>

            {/* Password & Confirm Password Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-control"
                    style={{ paddingLeft: '36px' }}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <Lock size={15} color="#64748b" style={{ position: 'absolute', left: '11px', top: '12px' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Confirm Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-control"
                    style={{ paddingLeft: '36px', paddingRight: '36px' }}
                    placeholder="Re-type password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Lock size={15} color="#64748b" style={{ position: 'absolute', left: '11px', top: '12px' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '10px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#64748b'
                    }}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Compliance Agreement Checkbox */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginTop: '2px' }}>
              <input
                type="checkbox"
                id="agree"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                style={{ cursor: 'pointer', marginTop: '3px' }}
              />
              <label htmlFor="agree" style={{ fontSize: '11px', color: '#64748b', cursor: 'pointer', lineHeight: 1.4 }}>
                I agree to the IMO-ISPS Maritime Security Protocol & consent to immutable SHA-256 recording of all operational actions.
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                fontWeight: 700,
                marginTop: '4px'
              }}
            >
              <span>{loading ? 'Registering Officer Credentials...' : 'Create & Register Account'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Login Redirect Footer */}
          <div style={{
            marginTop: '20px',
            paddingTop: '14px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '13px',
            color: '#64748b'
          }}>
            Already have an officer account?{' '}
            <button
              type="button"
              onClick={onGoToLogin}
              style={{
                background: 'none',
                border: 'none',
                color: '#0284c7',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                padding: 0
              }}
            >
              Sign In to Terminal
            </button>
          </div>
        </>
      )}
    </div>
  </div>
</div>
  );
};

export default Register;
