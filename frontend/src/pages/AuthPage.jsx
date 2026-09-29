import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Anchor, ShieldCheck, Lock, Mail, User, ArrowRight, ArrowLeft, Check, Sparkles } from 'lucide-react';

export const AuthPage = ({ initialTab = 'login', onBackToHome, onSuccess }) => {
  const { login, register } = useAuth();
  const [isLogin, setIsLogin] = useState(initialTab === 'login');
  const [email, setEmail] = useState('admin@auditflow.com');
  const [password, setPassword] = useState('audit123');
  const [name, setName] = useState('');
  const [role, setRole] = useState('viewer');
  const [department, setDepartment] = useState('Maritime Operations');
  const [assignedPort, setAssignedPort] = useState('Mumbai Port');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const demoAccounts = [
    { name: 'Capt. Rajesh Menon', email: 'admin@auditflow.com', role: 'admin', label: '👑 Admin (Full Access)', desc: 'Security Governance & Tamper Controls' },
    { name: 'Sunita Rao', email: 'portmanager@auditflow.com', role: 'port_manager', label: '⚓ Port Manager', desc: 'Mumbai Terminal & Loading' },
    { name: 'Capt. Vikram Sengupta', email: 'shipmanager@auditflow.com', role: 'ship_manager', label: '🚢 Ship Manager', desc: 'MSC Irina Master' },
    { name: 'Rahul Sharma', email: 'inspector@auditflow.com', role: 'inspector', label: '🔍 Inspector', desc: 'Customs & Bolt Seal Audit' },
    { name: 'Ananya Deshmukh', email: 'viewer@auditflow.com', role: 'viewer', label: '👁️ Viewer (Read Only)', desc: 'Observer & Compliance Audit' }
  ];

  const handleQuickDemo = (acc) => {
    setEmail(acc.email);
    setPassword('audit123');
    setIsLogin(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ name, email, password, role, department, assignedPort });
      }
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(180deg, #f1f5f9 0%, #e2e8f0 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 20px',
      position: 'relative'
    }}>
      {/* Top Back to Home Button */}
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="btn btn-secondary btn-sm"
          style={{
            position: 'absolute',
            top: '24px',
            left: '24px',
            zIndex: 10
          }}
        >
          <ArrowLeft size={14} />
          <span>Back to Landing Page</span>
        </button>
      )}

      <div style={{
        maxWidth: '520px',
        width: '100%',
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '20px',
        boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04)',
        padding: '40px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top Accent Line */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #0f3460, #0284c7, #10b981)'
        }} />

        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #0f3460 0%, #0284c7 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 14px auto',
            boxShadow: '0 6px 16px rgba(15, 52, 96, 0.2)'
          }}>
            <Anchor size={28} color="#fff" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 4px 0', letterSpacing: '-0.3px' }}>
            CONTAINERSHIP AUDIT SYSTEM
          </h2>
          <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700, letterSpacing: '0.8px' }}>
            IMMUTABLE MARITIME LEDGER & AIS MONITORING
          </div>
        </div>

        {/* 1-Click Quick Demo Sign-In Selector */}
        <div style={{
          marginBottom: '24px',
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0f3460', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              ⚡ 1-Click Quick Role Switcher:
            </span>
            <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700 }}>
              Password: audit123
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {demoAccounts.map(acc => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleQuickDemo(acc)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: email === acc.email ? '1.5px solid #0284c7' : '1px solid #e2e8f0',
                  background: email === acc.email ? '#e0f2fe' : '#ffffff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: email === acc.email ? '#0369a1' : '#0f172a' }}>
                    {acc.label}
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>
                    {acc.email} &bull; {acc.desc}
                  </div>
                </div>
                {email === acc.email && (
                  <Check size={14} color="#0284c7" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #f1f5f9', marginBottom: '22px' }}>
          <button
            onClick={() => setIsLogin(true)}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: isLogin ? '2px solid #0284c7' : 'none',
              color: isLogin ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => setIsLogin(false)}
            style={{
              flex: 1,
              padding: '10px',
              background: 'none',
              border: 'none',
              borderBottom: !isLogin ? '2px solid #0284c7' : 'none',
              color: !isLogin ? '#0284c7' : '#64748b',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Create Account
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div style={{
            background: '#fee2e2',
            color: '#b91c1c',
            border: '1px solid #fecaca',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '12px',
            marginBottom: '18px'
          }}>
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {!isLogin && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Full Name *
              </label>
              <input
                type="text"
                required
                className="input-control"
                placeholder="e.g. Officer Sunita Rao"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Official Email Address *
            </label>
            <input
              type="email"
              required
              className="input-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Password *
            </label>
            <input
              type="password"
              required
              className="input-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {!isLogin && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Role Tier
                  </label>
                  <select
                    className="select-control"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                  >
                    <option value="viewer">Viewer (Read Only)</option>
                    <option value="inspector">Inspector</option>
                    <option value="ship_manager">Ship Manager</option>
                    <option value="port_manager">Port Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                    Assigned Port
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    value={assignedPort}
                    onChange={(e) => setAssignedPort(e.target.value)}
                  />
                </div>
              </div>

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
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '12px', marginTop: '6px', fontSize: '14px', fontWeight: 700 }}
          >
            <span>{loading ? 'Authenticating...' : (isLogin ? 'Sign In to Maritime Ledger' : 'Create & Register Account')}</span>
            <ArrowRight size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
