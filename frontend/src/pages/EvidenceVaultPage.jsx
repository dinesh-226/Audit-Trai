import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FolderLock,
  Plus,
  Search,
  Filter,
  FileText,
  Image,
  ShieldCheck,
  Download,
  Copy,
  ExternalLink,
  UploadCloud
} from 'lucide-react';

export const EvidenceVaultPage = ({ onOpenEvidenceModal }) => {
  const { hasRole } = useAuth();
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [copiedHash, setCopiedHash] = useState(null);

  useEffect(() => {
    fetchEvidence();
  }, [categoryFilter]);

  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const data = await api.evidence.getAll({
        category: categoryFilter || undefined
      });
      setEvidenceList(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            CRYPTOGRAPHIC EVIDENCE VAULT
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Inspection Photos & Cargo Documents
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Tamper-proof documents, bills of lading, and seal photos sealed with SHA-256 integrity checksums
          </div>
        </div>

        {hasRole('admin', 'inspector', 'port_manager', 'ship_manager') && (
          <button
            onClick={() => onOpenEvidenceModal(null)}
            className="btn btn-primary"
          >
            <UploadCloud size={16} />
            <span>Attach Document / Photo</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="maritime-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{ minWidth: '220px' }}>
          <select
            className="select-control"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Evidence Categories</option>
            <option value="Inspection Photo">Inspection Photos</option>
            <option value="Bill of Lading">Bills of Lading</option>
            <option value="Customs Clearance">Customs Clearance</option>
            <option value="Report PDF">Report PDFs</option>
            <option value="Damage Evidence">Damage Evidence</option>
            <option value="Seal Verification Photo">Seal Verification Photos</option>
          </select>
        </div>
      </div>

      {/* Evidence Gallery Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading evidence documents...
        </div>
      ) : evidenceList.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          No evidence files found matching category.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {evidenceList.map((ev) => (
            <div key={ev.evidenceId} className="maritime-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Photo / Document Header */}
              {ev.fileType.startsWith('image') ? (
                <div style={{ height: '160px', overflow: 'hidden', background: '#000', position: 'relative' }}>
                  <img
                    src={ev.fileUrl}
                    alt={ev.fileName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <span className="badge badge-purple">{ev.category}</span>
                  </div>
                </div>
              ) : (
                <div style={{ height: '110px', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                  <FileText size={40} color="var(--cyan)" />
                  <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
                    <span className="badge badge-blue">{ev.category}</span>
                  </div>
                </div>
              )}

              {/* Body */}
              <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                    {ev.fileName}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--cyan)', fontWeight: 600, marginBottom: '8px' }}>
                    Container: <strong>{ev.containerId}</strong>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4', marginBottom: '12px' }}>
                    {ev.description || 'No description provided.'}
                  </div>
                </div>

                {/* SHA-256 Checksum Card */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '11px',
                  marginTop: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>SHA-256 Checksum</span>
                    <button
                      onClick={() => handleCopyHash(ev.fileHashSha256)}
                      style={{ background: 'none', border: 'none', color: '#10b981', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}
                    >
                      {copiedHash === ev.fileHashSha256 ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <code style={{ color: '#10b981', fontFamily: 'monospace', fontSize: '10px', wordBreak: 'break-all' }}>
                    {ev.fileHashSha256}
                  </code>
                </div>

                {/* Footer */}
                <div style={{ paddingTop: '12px', marginTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>By {ev.uploadedBy}</span>
                  <span>{new Date(ev.uploadedAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
