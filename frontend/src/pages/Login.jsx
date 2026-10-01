import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Anchor,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Ship,
  Radio,
  Sparkles,
  HelpCircle,
  KeyRound,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { ForgotPasswordModal } from '../components/ForgotPasswordModal';

export const Login = ({ onBackToHome, onGoToRegister, onSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [pendingApprovalMsg, setPendingApprovalMsg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [successBanner, setSuccessBanner] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setPendingApprovalMsg(null);
    setLoading(true);

    try {
      const res = await login(email, password);
      if (onSuccess) onSuccess(res?.user);
    } catch (err) {
      if (err.message && err.message.includes('pending approval')) {
        setPendingApprovalMsg(err.message);
      } else {
        setError(err.message || 'Authentication failed. Please verify your email and password.');
      }
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
          Don't have an officer account?{' '}
          <button
            onClick={onGoToRegister}
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
            Register Here
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
        {/* Left Side: Maritime Value Showcase (Desktop) */}
        <div style={{
          flex: 1,
          background: 'linear-gradient(135deg, #0f3460 0%, #16213e 50%, #0369a1 100%)',
          borderRadius: '20px',
          padding: '48px 40px',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(15, 52, 96, 0.3)'
        }}>
          {/* Subtle Background Globe Elements */}
          <div style={{
            position: 'absolute',
            top: '-60px',
            right: '-60px',
            width: '240px',
            height: '240px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(2, 132, 199, 0.3) 0%, rgba(2, 132, 199, 0) 70%)',
            pointerEvents: 'none'
          }} />

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
              marginBottom: '28px'
            }}>
              <ShieldCheck size={14} color="#86efac" />
              <span>PORT & SHIP TRACKING</span>
            </div>

            <h2 style={{
              fontSize: '32px',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '16px',
              letterSpacing: '-0.5px'
            }}>
              Container & Ship Tracking Platform
            </h2>

            <p style={{ fontSize: '15px', color: '#e2e8f0', lineHeight: 1.6, marginBottom: '36px' }}>
              Track container shipments, monitor ships at sea, and inspect activity records across major ports.
            </p>

            {/* 3 Value Pillars */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Lock size={18} color="#38bdf8" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Protected Activity History</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Every booking, seal check, and departure is permanently logged.</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Radio size={18} color="#86efac" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Live Ship Location Map</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Real-time speeds, headings, and route tracking across shipping lanes.</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Sparkles size={18} color="#fde047" />
                </div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>AI Assistant & Issue Alerts</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Instant alerts for unexpected container movements or temperature changes.</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{
            paddingTop: '24px',
            borderTop: '1px solid rgba(255, 255, 255, 0.15)',
            fontSize: '11px',
            color: '#cbd5e1',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>PORT OPERATIONS & AUDIT</span>
            <span>SECURE ACCESS</span>
          </div>
        </div>

        {/* Right Side: Clean Login Form */}
        <div style={{
          flex: 1.1,
          background: '#ffffff',
          borderRadius: '20px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 2px 4px -2px rgba(15, 23, 42, 0.05)',
          padding: '40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center'
        }}>
          {/* Header */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #0f3460 0%, #0284c7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '14px',
              boxShadow: '0 4px 10px rgba(15, 52, 96, 0.2)'
            }}>
              <Anchor size={22} color="#ffffff" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0', letterSpacing: '-0.4px' }}>
              Sign In to Maritime Portal
            </h1>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Enter your official credentials to access fleet telemetry, containers, and audit records.
            </p>
          </div>

          {/* Success Banner */}
          {successBanner && (
            <div style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '12px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <Check size={16} color="#059669" />
              <span>{successBanner}</span>
            </div>
          )}

          {/* Pending Approval Notice Banner */}
          {pendingApprovalMsg && (
            <div style={{
              background: '#fffbeb',
              color: '#92400e',
              border: '1px solid #fde68a',
              padding: '14px 16px',
              borderRadius: '10px',
              fontSize: '12px',
              marginBottom: '18px',
              lineHeight: 1.5
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, marginBottom: '4px', color: '#b45309' }}>
                <Clock size={16} />
                <span>Officer Registration Awaiting Admin Approval</span>
              </div>
              <div>{pendingApprovalMsg}</div>
              <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEmail('viewer@auditflow.com');
                    setPassword('audit123');
                    setPendingApprovalMsg(null);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                >
                  👁️ Log in as Viewer (Instant Access)
                </button>
              </div>
            </div>
          )}

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

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                Official Email Address *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  required
                  className="input-control"
                  style={{ paddingLeft: '38px' }}
                  placeholder="name@auditflow.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155', margin: 0 }}>
                  Password *
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    fontSize: '12px',
                    color: '#0284c7',
                    cursor: 'pointer',
                    fontWeight: 700,
                    textDecoration: 'underline'
                  }}
                >
                  Forgot password?
                </button>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="input-control"
                  style={{ paddingLeft: '38px', paddingRight: '38px' }}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '10px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="remember" style={{ fontSize: '12px', color: '#64748b', cursor: 'pointer' }}>
                Remember this workstation for 7 days
              </label>
            </div>

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
              <span>{loading ? 'Authenticating Credentials...' : 'Sign In to Maritime Ledger'}</span>
              <ArrowRight size={16} />
            </button>
          </form>

          {/* Registration Redirect Footer */}
          <div style={{
            marginTop: '24px',
            paddingTop: '16px',
            borderTop: '1px solid #f1f5f9',
            textAlign: 'center',
            fontSize: '13px',
            color: '#64748b'
          }}>
            Need new credentials?{' '}
            <button
              type="button"
              onClick={onGoToRegister}
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
              Register New Officer Account
            </button>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        initialEmail={email}
        onSuccessEmail={(confirmedEmail) => {
          setEmail(confirmedEmail);
          setSuccessBanner('Password updated successfully! You can now log in with your new password.');
        }}
      />
    </div>
  );
};

export default Login;
