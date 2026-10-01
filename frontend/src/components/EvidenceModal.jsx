import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, UploadCloud, FolderLock, FileText, CheckCircle2, Shield } from 'lucide-react';

export const EvidenceModal = ({ containerId, onClose, onSaved }) => {
  const [containersList, setContainersList] = useState([]);
  const [formData, setFormData] = useState({
    containerId: containerId || '',
    fileName: 'iso_17712_bolt_seal_inspection.jpg',
    category: 'Inspection Photo',
    description: 'ISO 17712 high-security tamper-resistant bolt seal photographic evidence.',
    fileUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
    fileType: 'image/jpeg'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sampleEvidencePresets = [
    {
      fileName: 'iso_17712_high_security_bolt_seal.jpg',
      category: 'Inspection Photo',
      fileUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop&q=80',
      description: 'Close-up photograph of ISO 17712 security bolt seal and etched barcode.'
    },
    {
      fileName: 'who_gdp_pharma_cold_chain_certificate.pdf',
      category: 'Report PDF',
      fileUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800&auto=format&fit=crop&q=80',
      description: 'WHO Good Distribution Practice (GDP) -20°C temperature log certificate.'
    },
    {
      fileName: 'imdg_class3_hazmat_declaration_manifest.pdf',
      category: 'Customs Clearance',
      fileUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&auto=format&fit=crop&q=80',
      description: 'International Maritime Dangerous Goods (IMDG) Class 3 Dangerous Goods Declaration.'
    },
    {
      fileName: 'icegate_customs_out_of_charge_pass.pdf',
      category: 'Customs Clearance',
      fileUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=800&auto=format&fit=crop&q=80',
      description: 'ICEGATE Customs Electronic Out-of-Charge Delivery Pass certificate.'
    }
  ];

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

  const handleApplyPreset = (preset) => {
    setFormData(prev => ({
      ...prev,
      fileName: preset.fileName,
      category: preset.category,
      fileUrl: preset.fileUrl,
      description: preset.description,
      fileType: preset.fileName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await api.evidence.attach({
        ...formData,
        containerId: formData.containerId.toUpperCase()
      });
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to attach evidence');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
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
              <UploadCloud size={20} color="var(--cyan)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Attach Cryptographic Evidence to Ledger
              </h3>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                File will be hashed with SHA-256 and sealed into the maritime audit trail
              </div>
            </div>
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

          {/* Presets */}
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
              Select Maritime Evidence Document Template:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {sampleEvidencePresets.map((pr, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleApplyPreset(pr)}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: formData.fileName === pr.fileName ? 'rgba(2, 132, 199, 0.15)' : 'var(--bg-secondary)',
                    border: `1px solid ${formData.fileName === pr.fileName ? 'var(--cyan)' : 'var(--border-color)'}`,
                    color: '#f8fafc',
                    textAlign: 'left',
                    fontSize: '11px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px'
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--cyan)' }}>{pr.category}</span>
                  <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {pr.fileName}
                  </span>
                </button>
              ))}
            </div>
          </div>

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
                  placeholder="e.g. ONEU-8821094"
                />
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Evidence Category
              </label>
              <select
                className="input-control"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="Inspection Photo">Inspection Photo</option>
                <option value="Bill of Lading">Bill of Lading</option>
                <option value="Customs Clearance">Customs Clearance</option>
                <option value="Weight Certificate">Weight Certificate</option>
                <option value="Damage Report">Damage Report</option>
                <option value="Report PDF">Report PDF</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              File Name
            </label>
            <input
              type="text"
              required
              className="input-control"
              value={formData.fileName}
              onChange={(e) => setFormData({ ...formData, fileName: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Photo / Document Direct URL
            </label>
            <input
              type="url"
              required
              className="input-control"
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Description & Context
            </label>
            <textarea
              className="input-control"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <FolderLock size={16} />
              <span>{loading ? 'Computing Hash & Sealing...' : 'Compute SHA-256 & Attach'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
