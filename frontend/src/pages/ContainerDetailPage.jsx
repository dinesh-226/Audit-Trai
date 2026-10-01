import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  ArrowLeft,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Ship,
  FileText,
  ClipboardCheck,
  UploadCloud,
  CheckCircle,
  FolderLock,
  ExternalLink
} from 'lucide-react';

export const ContainerDetailPage = ({ containerId, onBack, onOpenTimeline, onOpenInspection, onOpenEvidence }) => {
  const { hasRole } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContainerProfile();
  }, [containerId]);

  const fetchContainerProfile = async () => {
    setLoading(true);
    try {
      let targetId = containerId;
      if (!targetId) {
        const all = await api.containers.getAll();
        if (all?.length > 0) targetId = all[0].containerId;
      }
      if (targetId) {
        const res = await api.containers.getById(targetId);
        setData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
        Loading container profile and activity records...
      </div>
    );
  }

  if (!data?.container) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '80px' }}>
        <h3>Container not found</h3>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '16px' }}>
          Back to Containers
        </button>
      </div>
    );
  }

  const { container, audits, inspections, evidence, anomalies } = data;

  return (
    <div className="page-wrapper">
      {/* Top Back Nav & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button onClick={onBack} className="btn btn-outline btn-sm">
          <ArrowLeft size={14} />
          <span>Back to Containers</span>
        </button>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => onOpenTimeline(container.containerId)} className="btn btn-primary">
            <Clock size={16} />
            <span>View Journey Roadmap</span>
          </button>
        </div>
      </div>

      {/* Main Container Hero Card */}
      <div className="maritime-card-glow" style={{ padding: '28px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: 'var(--cyan-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box size={24} color="var(--cyan)" />
              </div>
              <div>
                <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {container.containerId}
                </h1>
                <div style={{ fontSize: '12px', color: 'var(--cyan)', fontWeight: 600 }}>
                  {container.type} &bull; {container.size} &bull; Owner: {container.ownerCompany}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginTop: '8px', maxWidth: '600px' }}>
              Cargo: <strong>{container.cargoDescription}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <span className="badge badge-cyan" style={{ fontSize: '13px', padding: '6px 14px' }}>
                {container.status}
              </span>
              <span className={`badge ${container.riskLevel === 'Low' ? 'badge-green' : container.riskLevel === 'Medium' ? 'badge-amber' : 'badge-red'}`} style={{ fontSize: '13px', padding: '6px 14px' }}>
                {container.riskLevel} Risk ({container.riskScore}/100)
              </span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Seal: <strong style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{container.sealNumber}</strong>
            </div>
          </div>
        </div>

        {/* 4 Metric Highlights */}
        <div style={{
          marginTop: '24px',
          padding: '16px 20px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Route & Location</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {container.origin} ➔ {container.destination}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--cyan)' }}>{container.currentLocation}</div>
          </div>

          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Assigned Vessel</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
              {container.assignedShipName || 'Yard Staged (No Vessel)'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Ship ID: {container.assignedShipId || 'N/A'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Physical Gross Weight</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {container.weightKg?.toLocaleString()} kg
            </div>
            <div style={{ fontSize: '11px', color: container.hazardClass !== 'Non-Hazardous' ? '#ef4444' : 'var(--text-muted)' }}>
              {container.hazardClass || 'Non-Hazardous'}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cold Chain Status</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: container.temperatureCelsius !== null ? (container.temperatureCelsius > -10 ? '#ef4444' : '#10b981') : 'var(--text-muted)', marginTop: '2px' }}>
              {container.temperatureCelsius !== null ? `${container.temperatureCelsius}°C` : 'Ambient Dry Cargo'}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {container.isDelayed ? '⚠️ Flagged Delayed' : '✅ On Schedule'}
            </div>
          </div>
        </div>
      </div>

      {/* Risk Factors Breakdown Card if any */}
      {container.riskReasons?.length > 0 && (
        <div className="maritime-card" style={{ padding: '20px 24px', marginBottom: '28px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <AlertTriangle size={18} color="#ef4444" />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#f87171' }}>
              Risk Analysis & Security Audit Findings
            </h3>
          </div>
          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {container.riskReasons.map((reason, idx) => (
              <li key={idx}>{reason}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Grid: Journey Milestones, Inspections, & Evidence */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1.2fr', gap: '24px', marginBottom: '28px' }}>
        {/* Left: Journey Milestones Summary */}
        <div className="maritime-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Lifecycle Milestone History
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                {container.journeyMilestones?.length || 0} recorded physical events
              </div>
            </div>
            <button onClick={() => onOpenTimeline(container.containerId)} className="btn btn-outline btn-sm">
              <span>Full Interactive Roadmap</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {container.journeyMilestones?.map((m, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '14px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  border: '1px solid var(--cyan)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                  color: 'var(--cyan)'
                }}>
                  {idx + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>
                      {m.stage}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(m.timestamp).toLocaleDateString()} {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--cyan)', marginTop: '2px' }}>
                    {m.location} {m.shipName ? `&bull; ${m.shipName}` : ''}
                  </div>
                  {m.notes && (
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      {m.notes}
                    </div>
                  )}
                  {m.hash && (
                    <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: '#10b981', marginTop: '4px' }}>
                      SHA-256: {m.hash.substring(0, 24)}...
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Attached Evidence & Inspections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Inspections */}
          <div className="maritime-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Inspection Reports ({inspections?.length || 0})
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Customs & safety physical inspections
                </div>
              </div>
              {hasRole('admin', 'inspector') && (
                <button onClick={() => onOpenInspection(container.containerId)} className="btn btn-secondary btn-sm">
                  <ClipboardCheck size={14} color="var(--cyan)" />
                  <span>Inspect</span>
                </button>
              )}
            </div>

            {inspections?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                No inspections recorded for this container yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {inspections.map(ins => (
                  <div key={ins.inspectionId} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#f8fafc' }}>
                        {ins.inspectionType}
                      </span>
                      <span className={`badge ${ins.result === 'Passed' ? 'badge-green' : 'badge-red'}`}>
                        {ins.result}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      By Inspector <strong>{ins.inspectorName}</strong> at {ins.port} ({new Date(ins.createdAt).toLocaleDateString()})
                    </div>
                    {ins.notes && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {ins.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Evidence Vault */}
          <div className="maritime-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                  Attached Evidence & Photos ({evidence?.length || 0})
                </h3>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Tamper-proof bills of lading & seal photos
                </div>
              </div>
              {hasRole('admin', 'inspector', 'port_manager', 'ship_manager') && (
                <button onClick={() => onOpenEvidence(container.containerId)} className="btn btn-secondary btn-sm">
                  <UploadCloud size={14} color="var(--cyan)" />
                  <span>Attach</span>
                </button>
              )}
            </div>

            {evidence?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '12px' }}>
                No evidence files attached.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {evidence.map(ev => (
                  <div key={ev.evidenceId} style={{ padding: '12px', borderRadius: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 700, fontSize: '13px', color: '#38bdf8' }}>
                        {ev.fileName}
                      </span>
                      <span className="badge badge-purple">{ev.category}</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                      Uploaded by {ev.uploadedBy} &bull; SHA-256: <code style={{ color: '#10b981' }}>{ev.fileHashSha256?.substring(0, 16)}...</code>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
