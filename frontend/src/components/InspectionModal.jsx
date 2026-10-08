import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, ClipboardCheck, ShieldCheck, Check, AlertCircle } from 'lucide-react';

export const InspectionModal = ({ containerId, shipId, onClose, onSaved }) => {
  const { user } = useAuth();
  const [containersList, setContainersList] = useState([]);
  const [containersLoading, setContainersLoading] = useState(true);
  const [containersError, setContainersError] = useState('');
  const [formData, setFormData] = useState({
    containerId: containerId || '',
    shipId: shipId || '',
    port: user?.assignedPort || 'Mumbai Port',
    inspectionType: 'Safety & Structural',
    result: '',
    notes: '',
    sealIntact: false,
    temperatureRecorded: ''
  });

  const [checklist, setChecklist] = useState([
    { item: 'Physical seal verified', passed: false, comments: '' },
    { item: 'Corner castings and structural integrity checked', passed: false, comments: '' },
    { item: 'CSC safety plate checked', passed: false, comments: '' },
    { item: 'Door gaskets and locking bars checked', passed: false, comments: '' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContainers();
  }, []);

  useEffect(() => {
    if (containerId) {
      setFormData(prev => ({
        ...prev,
        containerId: containerId.trim().toUpperCase(),
        shipId: shipId || prev.shipId
      }));
    }
  }, [containerId, shipId]);

  const fetchContainers = async () => {
    try {
      const data = await api.containers.getAll();
      const list = Array.isArray(data) ? data : [];
      setContainersList(list);
      if (!containerId && list.length > 0) {
        setFormData(prev => ({
          ...prev,
          containerId: prev.containerId || list[0].containerId,
          shipId: prev.shipId || list[0].assignedShipId || ''
        }));
      }
    } catch (e) {
      console.error(e);
      setContainersError(e.message || 'Unable to load containers.');
    } finally {
      setContainersLoading(false);
    }
  };

  const toggleChecklistItem = (index) => {
    setChecklist(prev => {
      const copy = [...prev];
      copy[index].passed = !copy[index].passed;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetId = formData.containerId?.trim();
    if (!targetId) {
      setError('Select a container before submitting an inspection.');
      return;
    }
    if (!formData.result) {
      setError('Select an inspection result before submitting.');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const formattedChecklist = checklist.map(item => ({
        item: item.item,
        status: item.passed ? 'Pass' : 'Fail',
        passed: Boolean(item.passed),
        comments: item.comments || ''
      }));

      const payload = {
        ...formData,
        containerId: targetId.toUpperCase(),
        port: formData.port || user?.assignedPort || 'Mumbai Port',
        sealIntact: checklist[0]?.passed || false,
        temperatureRecorded: formData.temperatureRecorded !== '' ? Number(formData.temperatureRecorded) : null,
        checklist: formattedChecklist
      };

      await api.inspections.create(payload);
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record inspection');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ClipboardCheck size={20} color="var(--cyan)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              Perform Container Physical Inspection
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Container Identifier *
              </label>
              {!containersLoading && containersList.length > 0 ? (
                <select
                  className="input-control"
                  value={formData.containerId}
                  onChange={(e) => setFormData({ ...formData, containerId: e.target.value })}
                  required
                >
                  <option value="">Select a container</option>
                  {containersList.map(c => (
                    <option key={c.containerId} value={c.containerId}>
                      {c.containerId} ({c.type} - {c.ownerCompany})
                    </option>
                  ))}
                </select>
              ) : (
                <div role={containersError ? 'alert' : 'status'} style={{ fontSize: '12px', color: containersError ? '#b91c1c' : 'var(--text-muted)' }}>
                  {containersLoading ? 'Loading containers...' : containersError || 'No containers are registered. Add a container before starting an inspection.'}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Inspection Location / Port *
              </label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.port}
                onChange={(e) => setFormData({ ...formData, port: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Inspection Category
              </label>
              <select
                className="input-control"
                value={formData.inspectionType}
                onChange={(e) => setFormData({ ...formData, inspectionType: e.target.value })}
              >
                <option value="Safety & Structural">Safety & Structural</option>
                <option value="Customs & Border Control">Customs & Border Control</option>
                <option value="Reefer Temp & Integrity">Reefer Temp & Integrity</option>
                <option value="Dangerous Goods Compliance">Dangerous Goods Compliance</option>
                <option value="Seal Verification">Seal Verification</option>
                <option value="Cold Chain & Phytosanitary">Cold Chain & Phytosanitary</option>
                <option value="Radiation & Security Screening">Radiation & Security Screening</option>
                <option value="Post-Voyage Inbound Inspection">Post-Voyage Inbound Inspection</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Overall Inspection Verdict *
              </label>
              <select
                className="input-control"
                value={formData.result}
                onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                required
              >
                <option value="" disabled>Select a result</option>
                <option value="Passed">Passed (Clear for Transit / Gate Out)</option>
                <option value="Failed">Failed (Hold Cargo & Flag Anomaly)</option>
                <option value="Requires Re-inspection">Requires Re-inspection</option>
                <option value="Flagged for Quarantine">Flagged for Quarantine</option>
                <option value="On Hold">On Hold</option>
                <option value="Repair Required">Repair Required</option>
              </select>
            </div>
          </div>

          {/* Verification Checklist */}
          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Mandatory Physical Verification Checklist
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-secondary)', padding: '12px', borderRadius: '8px' }}>
              {checklist.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => toggleChecklistItem(idx)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '6px 8px',
                    background: item.passed ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  <div style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '4px',
                    background: item.passed ? '#10b981' : '#ef4444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff'
                  }}>
                    {item.passed ? <Check size={12} strokeWidth={3} /> : <X size={12} strokeWidth={3} />}
                  </div>
                  <span style={{ flex: 1, color: item.passed ? '#f8fafc' : '#f87171', fontWeight: 600 }}>
                    {item.item}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {item.comments}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Inspector Detailed Notes & Findings
            </label>
            <textarea
              className="input-control"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading || containersLoading || containersList.length === 0 || !formData.containerId || !formData.result} className="btn btn-primary">
              <ShieldCheck size={16} />
              <span>{loading ? 'Submitting & Hashing...' : 'Sign & Submit Inspection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
