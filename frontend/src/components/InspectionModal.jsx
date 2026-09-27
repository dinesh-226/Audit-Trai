import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, ClipboardCheck, ShieldCheck, Check, AlertCircle } from 'lucide-react';

export const InspectionModal = ({ containerId, shipId, onClose, onSaved }) => {
  const [containersList, setContainersList] = useState([]);
  const [formData, setFormData] = useState({
    containerId: containerId || '',
    shipId: shipId || '',
    port: 'Mumbai Port (JNPT)',
    inspectionType: 'Safety & Structural',
    result: 'Passed',
    notes: 'Physical ISO 17712 bolt seal intact. No structural deformations on corner castings.',
    sealIntact: true,
    temperatureRecorded: ''
  });

  const [checklist, setChecklist] = useState([
    { item: 'Physical ISO 17712 Bolt Seal Intact & Verified', passed: true, comments: 'High-security bolt seal matched digital manifest' },
    { item: 'Corner Castings & Structural Integrity', passed: true, comments: 'Solid condition, no cracks or twists on 8 corners' },
    { item: 'CSC Safety Plate Legible & Valid', passed: true, comments: 'Tare & Max Gross Weight certified' },
    { item: 'Weather-tight Door Gaskets & Locking Bars', passed: true, comments: 'No light or moisture infiltration' }
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchContainers();
  }, []);

  const fetchContainers = async () => {
    try {
      const data = await api.containers.getAll();
      setContainersList(data || []);
      if (!containerId && data?.length > 0) {
        setFormData(prev => ({ ...prev, containerId: data[0].containerId }));
      }
    } catch (e) {
      console.error(e);
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
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        containerId: formData.containerId.toUpperCase(),
        temperatureRecorded: formData.temperatureRecorded !== '' ? Number(formData.temperatureRecorded) : null,
        checklist
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
              {containersList.length > 0 ? (
                <select
                  className="input-control"
                  value={formData.containerId}
                  onChange={(e) => setFormData({ ...formData, containerId: e.target.value })}
                  required
                >
                  {containersList.map(c => (
                    <option key={c.containerId} value={c.containerId}>
                      {c.containerId} ({c.type} - {c.ownerCompany})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required
                  className="input-control"
                  value={formData.containerId}
                  onChange={(e) => setFormData({ ...formData, containerId: e.target.value })}
                  placeholder="e.g. ONEU-8821094 or MSCU-7492014"
                />
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
                <option value="Cold Chain & Phytosanitary">Cold Chain & Phytosanitary</option>
                <option value="Dangerous Goods / Hazmat">Dangerous Goods / Hazmat</option>
                <option value="Radiation & Security Screening">Radiation & Security Screening</option>
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
              >
                <option value="Passed">Passed (Clear for Transit / Gate Out)</option>
                <option value="Failed">Failed (Hold Cargo & Flag Anomaly)</option>
                <option value="Conditional Pass">Conditional Pass (Pending Document Signoff)</option>
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
            <button type="submit" disabled={loading} className="btn btn-primary">
              <ShieldCheck size={16} />
              <span>{loading ? 'Submitting & Hashing...' : 'Sign & Submit Inspection'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
