import React, { useState } from 'react';
import { api } from '../services/api';
import {
  KeyRound,
  Mail,
  Lock,
  ArrowRight,
  CheckCircle,
  X,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Eye,
  EyeOff
} from 'lucide-react';

export const ForgotPasswordModal = ({ isOpen, onClose, initialEmail = '', onSuccessEmail }) => {
  const [step, setStep] = useState(1); // 1: enter email, 2: enter code & new password, 3: success
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  if (!isOpen) return null;

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError(null);
    if (!email) {
      setError('Please enter your registered official email address.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.forgotPassword(email);
      setGeneratedCode(res.resetCode);
      setCode(res.resetCode || '');
      setStep(2);
    } catch (err) {
      setError(err.message || 'Failed to request password reset code. Please check your email address.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (!code) {
      setError('Please enter the 6-digit verification security code.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match. Please verify both password entries.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.auth.resetPassword(email, code, newPassword);
      setSuccessMsg(res.message || 'Password has been reset successfully.');
      setStep(3);
    } catch (err) {
      setError(err.message || 'Failed to reset password. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setError(null);
    setSuccessMsg(null);
    setCode('');
    setNewPassword('');
    setConfirmPassword('');
    onClose();
  };

  const handleFinish = () => {
    if (onSuccessEmail) onSuccessEmail(email);
    handleClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '480px',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25)',
        border: '1px solid #e2e8f0',
        overflow: 'hidden',
        animation: 'fadeIn 0.2s ease-out'
      }}>
        {/* Header */}
        <div style={{
          padding: '24px 28px 20px 28px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)'
            }}>
              <KeyRound size={20} color="#ffffff" />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                {step === 1 && 'Reset Officer Password'}
                {step === 2 && 'Verify Code & Set Password'}
                {step === 3 && 'Password Reset Complete'}
              </h2>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                {step === 1 && 'Step 1 of 2: Confirm Account Email'}
                {step === 2 && 'Step 2 of 2: Security Verification'}
                {step === 3 && 'Credentials Successfully Updated'}
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b'
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '28px' }}>
          {/* Error Banner */}
          {error && (
            <div style={{
              background: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
              padding: '10px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertTriangle size={15} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* STEP 1: Enter Email */}
          {step === 1 && (
            <form onSubmit={handleRequestCode} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 4px 0', lineHeight: 1.5 }}>
                Enter the official email associated with your maritime account. We will generate a cryptographic verification code for password renewal.
              </p>

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
                    placeholder="e.g. admin@auditflow.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ flex: 1.5 }}
                >
                  <span>{loading ? 'Generating Code...' : 'Send Security Code'}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Enter Code & New Password */}
          {step === 2 && (
            <form onSubmit={handleResetPassword} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Generated Code Demonstration Card */}
              {generatedCode && (
                <div style={{
                  background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
                  border: '1px solid #bae6fd',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '11px', color: '#0369a1', fontWeight: 800, textTransform: 'uppercase' }}>
                      Security Verification Code:
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f3460', letterSpacing: '4px', fontFamily: 'monospace' }}>
                      {generatedCode}
                    </div>
                  </div>
                  <span style={{ fontSize: '11px', color: '#0284c7', background: '#ffffff', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>
                    Valid for 15m
                  </span>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  6-Digit Verification Code *
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="input-control"
                  style={{ fontSize: '16px', letterSpacing: '3px', fontWeight: 700, textAlign: 'center' }}
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-control"
                    style={{ paddingLeft: '38px', paddingRight: '38px' }}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '12px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Confirm New Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="input-control"
                    style={{ paddingLeft: '38px' }}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{ flex: 1.5 }}
                >
                  <span>{loading ? 'Updating Password...' : 'Reset & Save'}</span>
                  <ShieldCheck size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Success Confirmation */}
          {step === 3 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <CheckCircle size={32} />
              </div>

              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px 0' }}>
                Password Reset Successfully!
              </h3>

              <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 24px 0' }}>
                Your account password has been updated in the cryptographic ledger. You can now log in with your new password.
              </p>

              <button
                type="button"
                onClick={handleFinish}
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontSize: '14px', fontWeight: 700 }}
              >
                <span>Proceed to Sign In</span>
                <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
