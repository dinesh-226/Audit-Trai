import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  Bug,
  Lock,
  ArrowRight
} from 'lucide-react';

export const TamperSimulatorModal = ({ onClose, onTamperExecuted }) => {
  const [logs, setLogs] = useState([]);
  const [selectedAuditId, setSelectedAuditId] = useState('');
  const [fieldToAlter, setFieldToAlter] = useState('location');
  const [fakeValue, setFakeValue] = useState('UNAUTHORIZED_MODIFIED_PORT_LOCATION');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSampleLogs();
  }, []);

  const fetchSampleLogs = async () => {
    try {
      const data = await api.auditLogs.getAll({ limit: 15 });
      setLogs(data.logs || []);
      if (data.logs?.length > 0) {
        setSelectedAuditId(data.logs[Math.floor(data.logs.length / 2)]?.auditId || data.logs[0].auditId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSimulateTamper = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.auditLogs.simulateTamper({
        auditId: selectedAuditId,
        fieldName: fieldToAlter,
        fakeValue
      });
      setResult(res);
      if (onTamperExecuted) onTamperExecuted();
    } catch (e) {
      setError(e.message || 'Failed to execute tamper simulation');
    } finally {
      setLoading(false);
    }
  };

  const handleRepairChain = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.auditLogs.repairChain();
      setResult({ message: 'Audit trail ledger successfully repaired! All hashes re-calculated and verified.' });
      if (onTamperExecuted) onTamperExecuted();
    } catch (e) {
      setError(e.message || 'Failed to repair chain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'rgba(239, 68, 68, 0.08)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--danger-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldAlert size={20} color="var(--danger)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#f8fafc' }}>
                Cryptographic Tamper Simulator
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 600 }}>
                Security Demonstration & Integrity Attack Testing Tool
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: '8px',
            padding: '12px 16px',
            fontSize: '12px',
            color: '#fbbf24',
            marginBottom: '20px',
            lineHeight: '1.5'
          }}>
            <strong>How it works:</strong> This tool simulates an adversary bypassing the application layer and directly altering a raw record inside MongoDB. Because the SHA-256 hash was chained to preceding blocks, the <strong>"Verify Audit Integrity"</strong> engine will immediately catch the mismatch and pin-point the exact compromised block!
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Select Target Audit Log */}
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Select Target Audit Log to Modify:
              </label>
              <select
                className="select-control"
                value={selectedAuditId}
                onChange={(e) => setSelectedAuditId(e.target.value)}
              >
                {logs.map((log) => (
                  <option key={log.auditId} value={log.auditId}>
                    Block #{log.sequenceNumber} &bull; {log.auditId} ({log.action} on {log.entityType} {log.entityId})
                  </option>
                ))}
              </select>
            </div>

            {/* Field to Alter */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Field to Alter:
                </label>
                <select
                  className="select-control"
                  value={fieldToAlter}
                  onChange={(e) => setFieldToAlter(e.target.value)}
                >
                  <option value="location">Location</option>
                  <option value="username">Username / Operator</option>
                  <option value="action">Action Type</option>
                  <option value="userRole">User Role</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Forged / Tampered Value:
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={fakeValue}
                  onChange={(e) => setFakeValue(e.target.value)}
                  placeholder="Enter forged value..."
                />
              </div>
            </div>

            {/* Attack Button */}
            <div style={{ marginTop: '8px' }}>
              <button
                onClick={handleSimulateTamper}
                disabled={loading || !selectedAuditId}
                className="btn btn-danger"
                style={{ width: '100%', padding: '12px', fontSize: '13px' }}
              >
                <Bug size={16} />
                <span>{loading ? 'Simulating Tamper...' : 'Simulate Unauthorized Database Modification'}</span>
              </button>
            </div>

            {/* Output result */}
            {result && (
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '14px',
                fontSize: '12px',
                marginTop: '10px'
              }}>
                <div style={{ color: 'var(--cyan)', fontWeight: 700, marginBottom: '4px' }}>
                  ⚡ Simulation Result:
                </div>
                <div style={{ color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                  {result.message}
                </div>
                {result.instruction && (
                  <div style={{ color: '#fbbf24', marginTop: '8px', fontWeight: 600 }}>
                    👉 {result.instruction}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px' }}>
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Restore option */}
        <div style={{
          padding: '16px 24px',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <button
            onClick={handleRepairChain}
            disabled={loading}
            className="btn btn-outline btn-sm"
            style={{ color: 'var(--success)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
          >
            <RotateCcw size={14} />
            <span>Repair & Restore Audit Trail</span>
          </button>

          <button onClick={onClose} className="btn btn-secondary btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
