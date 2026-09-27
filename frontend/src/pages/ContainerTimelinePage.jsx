import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Clock,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Ship,
  MapPin,
  Box,
  QrCode,
  FileText,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';

export const ContainerTimelinePage = ({ initialContainerId, onBack, onOpenQr }) => {
  const [containers, setContainers] = useState([]);
  const [selectedId, setSelectedId] = useState(initialContainerId || '');
  const [container, setContainer] = useState(null);
  const [loading, setLoading] = useState(true);

  const FULL_LIFECYCLE_STAGES = [
    { key: 'BOOKED', label: 'Booked' },
    { key: 'READY FOR LOADING', label: 'Ready for Loading' },
    { key: 'LOADED', label: 'Loaded' },
    { key: 'DEPARTED', label: 'Departed' },
    { key: 'IN TRANSIT', label: 'In Transit' },
    { key: 'ARRIVED AT PORT', label: 'Arrived at Port' },
    { key: 'UNLOADED', label: 'Unloaded' },
    { key: 'INSPECTED', label: 'Inspected' },
    { key: 'DELIVERED', label: 'Delivered' }
  ];

  useEffect(() => {
    fetchContainerList();
  }, []);

  useEffect(() => {
    if (selectedId) {
      fetchContainerData(selectedId);
    }
  }, [selectedId]);

  const fetchContainerList = async () => {
    try {
      const data = await api.containers.getAll();
      setContainers(data || []);
      if (!initialContainerId && data?.length > 0) {
        setSelectedId(data[0].containerId);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchContainerData = async (cId) => {
    setLoading(true);
    try {
      const res = await api.containers.getById(cId);
      setContainer(res?.container || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const milestones = container?.journeyMilestones || [];

  return (
    <div className="page-wrapper">
      {/* Header & Container Picker */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <button onClick={onBack} className="btn btn-outline btn-sm" style={{ marginBottom: '12px' }}>
            <ArrowLeft size={14} />
            <span>Back to Previous View</span>
          </button>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            CONTAINER LIFECYCLE ROADMAP
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Visual Journey Timeline & Verification
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            End-to-end transparent and tamper-resistant milestone progression
          </div>
        </div>

        {/* Container Selector & QR Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <select
            className="select-control"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ minWidth: '220px', fontWeight: 700 }}
          >
            {containers.map(c => (
              <option key={c.containerId} value={c.containerId}>
                {c.containerId} &bull; {c.status} ({c.cargoDescription.substring(0, 20)}...)
              </option>
            ))}
          </select>

          {container && (
            <button onClick={() => onOpenQr(container)} className="btn btn-primary">
              <QrCode size={16} />
              <span>QR Pass</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
          Loading container journey roadmap...
        </div>
      ) : !container ? (
        <div style={{ textAlign: 'center', padding: '80px' }}>
          <h3>Container not found</h3>
        </div>
      ) : (
        <>
          {/* Container Quick Specs Card */}
          <div className="maritime-card" style={{ padding: '20px 24px', marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Container ID</span>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{container.containerId}</div>
                <div style={{ fontSize: '11px', color: 'var(--cyan)' }}>{container.type} &bull; {container.size}</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cargo Manifest</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{container.cargoDescription}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Weight: {container.weightKg?.toLocaleString()} kg</div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Route & Vessel</span>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {container.origin} ➔ {container.destination}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--cyan)' }}>
                  {container.assignedShipName || 'Yard Staged'}
                </div>
              </div>

              <div>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Security & Risk</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className={`badge ${container.riskLevel === 'Low' ? 'badge-green' : container.riskLevel === 'Medium' ? 'badge-amber' : 'badge-red'}`}>
                    {container.riskLevel} Risk
                  </span>
                  <span style={{ fontSize: '11px', fontFamily: 'monospace', color: '#38bdf8' }}>
                    {container.sealNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Progress Ribbon */}
          <div className="maritime-card" style={{ padding: '24px', marginBottom: '36px', overflowX: 'auto' }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '16px' }}>
              Standard Maritime Milestone Progression
            </div>
            <div style={{ display: 'flex', alignItems: 'center', minWidth: '800px', position: 'relative' }}>
              {FULL_LIFECYCLE_STAGES.map((stage, index) => {
                const isCompleted = milestones.some(m => m.stage === stage.key);
                const isCurrent = container.status.toUpperCase() === stage.key || (index === milestones.length - 1 && isCompleted);

                return (
                  <React.Fragment key={stage.key}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', zIndex: 2 }}>
                      <div style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: isCompleted ? 'linear-gradient(135deg, #0284c7 0%, #00b4d8 100%)' : 'var(--bg-secondary)',
                        border: `2px solid ${isCompleted ? '#00b4d8' : 'var(--border-color)'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: isCompleted ? '0 0 12px rgba(0, 180, 216, 0.4)' : 'none'
                      }}>
                        {isCompleted ? (
                          <CheckCircle2 size={16} color="#ffffff" />
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>{index + 1}</span>
                        )}
                      </div>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: isCompleted ? 700 : 500,
                        color: isCompleted ? '#0f172a' : 'var(--text-muted)',
                        textAlign: 'center',
                        maxWidth: '90px'
                      }}>
                        {stage.label}
                      </span>
                    </div>

                    {index < FULL_LIFECYCLE_STAGES.length - 1 && (
                      <div style={{
                        flex: 1,
                        height: '3px',
                        background: isCompleted ? 'linear-gradient(90deg, #00b4d8, #0284c7)' : 'var(--border-color)',
                        margin: '0 4px',
                        marginBottom: '20px'
                      }} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>

          {/* Detailed Vertical Milestone Timeline Cards */}
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ position: 'relative', paddingLeft: '40px' }}>
              {/* Vertical connector line */}
              <div style={{
                position: 'absolute',
                left: '15px',
                top: '10px',
                bottom: '10px',
                width: '3px',
                background: 'linear-gradient(180deg, #00b4d8 0%, #0284c7 50%, #10b981 100%)',
                borderRadius: '2px'
              }} />

              {milestones.map((milestone, idx) => (
                <div key={idx} style={{ position: 'relative', marginBottom: '28px' }}>
                  {/* Node Circle on Line */}
                  <div style={{
                    position: 'absolute',
                    left: '-32px',
                    top: '18px',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: '#00b4d8',
                    border: '3px solid var(--bg-primary)',
                    boxShadow: '0 0 10px #00b4d8'
                  }} />

                  {/* Milestone Card */}
                  <div className="maritime-card-glow" style={{ padding: '22px 26px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                          {milestone.stage}
                        </span>
                        <span className="badge badge-cyan">{milestone.status}</span>
                      </div>

                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={14} />
                        <span>{new Date(milestone.timestamp).toLocaleDateString()} at {new Date(milestone.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--cyan)', marginBottom: '8px' }}>
                      <MapPin size={14} />
                      <strong style={{ color: '#38bdf8' }}>{milestone.location}</strong>
                      {milestone.shipName && (
                        <span>&bull; Assigned Vessel: <strong>{milestone.shipName}</strong></span>
                      )}
                    </div>

                    {milestone.notes && (
                      <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: '1.5' }}>
                        {milestone.notes}
                      </div>
                    )}

                    {/* Officer Signature & Cryptographic Hash Footer */}
                    <div style={{
                      paddingTop: '12px',
                      borderTop: '1px solid var(--border-color)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                      fontSize: '11px'
                    }}>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Signed by: <strong style={{ color: 'var(--text-primary)' }}>{milestone.performedBy}</strong> ({milestone.userRole})
                      </div>

                      {milestone.hash && (
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                          padding: '3px 8px',
                          borderRadius: '4px',
                          color: '#10b981',
                          fontFamily: 'var(--font-mono)'
                        }}>
                          <ShieldCheck size={13} color="#10b981" />
                          <span>SHA-256: {milestone.hash.substring(0, 20)}...</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
