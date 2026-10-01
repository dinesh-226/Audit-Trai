import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardCheck,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  FileText,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const InspectionsPage = ({ onOpenInspectionModal }) => {
  const { hasRole } = useAuth();
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resultFilter, setResultFilter] = useState('');

  useEffect(() => {
    fetchInspections();
  }, [resultFilter]);

  const fetchInspections = async () => {
    setLoading(true);
    try {
      const data = await api.inspections.getAll({
        result: resultFilter || undefined
      });
      setInspections(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            INSPECTIONS
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Container Inspections
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Container safety checks, seal inspections, and pass/fail status
          </div>
        </div>

        {hasRole('admin', 'inspector', 'port_manager') && (
          <button
            onClick={() => onOpenInspectionModal(null)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>New Inspection</span>
          </button>
        )}
      </div>

      {/* Filter Bar */}
      <div className="maritime-card" style={{ padding: '16px 20px', marginBottom: '24px', display: 'flex', gap: '14px', alignItems: 'center' }}>
        <div style={{ minWidth: '200px' }}>
          <select
            className="select-control"
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
          >
            <option value="">All Inspection Results</option>
            <option value="Passed">Passed</option>
            <option value="Failed">Failed</option>
            <option value="Requires Re-inspection">Requires Re-inspection</option>
            <option value="Flagged for Quarantine">Flagged for Quarantine</option>
          </select>
        </div>

        <button onClick={fetchInspections} className="btn btn-secondary">
          <RotateCcw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Inspections Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading inspection records...
        </div>
      ) : inspections.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          No inspection records found.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {inspections.map((ins) => (
            <div key={ins.inspectionId} className="maritime-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                      Container: {ins.containerId}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--cyan)', fontFamily: 'monospace' }}>
                      {ins.inspectionId} &bull; {ins.inspectionType}
                    </div>
                  </div>
                  <span className={`badge ${ins.result === 'Passed' ? 'badge-green' : 'badge-red'}`}>
                    {ins.result}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  Location: <strong>{ins.port}</strong> &bull; Inspector: <strong>{ins.inspectorName}</strong>
                </div>

                {/* Checklist preview */}
                {ins.checklist?.length > 0 && (
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px 12px', borderRadius: '6px', marginBottom: '14px', fontSize: '11px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase' }}>
                      Verified Items:
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {ins.checklist.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: item.passed ? '#10b981' : '#ef4444' }}>
                            {item.passed ? '✓' : '✗'}
                          </span>
                          <span style={{ color: 'var(--text-primary)' }}>{item.item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {ins.notes && (
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', marginBottom: '12px' }}>
                    "{ins.notes}"
                  </div>
                )}
              </div>

              <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--text-muted)' }}>
                <span>{new Date(ins.createdAt).toLocaleDateString()}</span>
                {ins.auditId && (
                  <span style={{ fontFamily: 'monospace', color: 'var(--cyan)' }}>
                    Audit: {ins.auditId}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
