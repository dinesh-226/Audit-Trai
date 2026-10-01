import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  Activity,
  AlertTriangle,
  Clock,
  Shield,
  Box,
  CheckCircle,
  TrendingUp,
  RotateCcw,
  Sparkles
} from 'lucide-react';

export const RiskAnalysisPage = ({ onSelectContainer }) => {
  const [containers, setContainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRiskProfiles();
  }, []);

  const fetchRiskProfiles = async () => {
    setLoading(true);
    try {
      const data = await api.containers.getAll();
      // Sort highest risk score first
      const sorted = (data || []).sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));
      setContainers(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const highRiskContainers = containers.filter(c => c.riskLevel === 'High' || c.riskLevel === 'Critical');
  const delayedContainers = containers.filter(c => c.isDelayed);

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            SAFETY & RISK CHECK
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Safety & Risk Analysis
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Review container risk levels, failed inspections, and transit delays
          </div>
        </div>

        <button onClick={fetchRiskProfiles} className="btn btn-secondary">
          <RotateCcw size={14} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Risk Metrics Banner */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '28px'
      }}>
        <div className="maritime-card" style={{ padding: '18px 20px', borderLeft: '4px solid #ef4444' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Critical & High Risk Units
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#ef4444', marginTop: '4px' }}>
            {highRiskContainers.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Requiring immediate cargo inspection
          </div>
        </div>

        <div className="maritime-card" style={{ padding: '18px 20px', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Transit & Port Delays
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
            {delayedContainers.length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Exceeding configured voyage SLA
          </div>
        </div>

        <div className="maritime-card" style={{ padding: '18px 20px', borderLeft: '4px solid #10b981' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Low Risk Verified
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
            {containers.filter(c => c.riskLevel === 'Low').length}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Nominal operations
          </div>
        </div>
      </div>

      {/* Container Risk Factor Breakdown List */}
      <div className="maritime-card" style={{ padding: '24px', marginBottom: '28px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>
          Container Risk Level Matrix & Diagnostic Explanations
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Calculating multi-factor risk scores...
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {containers.map((c) => (
              <div
                key={c.containerId}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '8px',
                      background: c.riskLevel === 'Critical' || c.riskLevel === 'High' ? 'var(--danger-light)' : 'var(--success-light)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                      color: c.riskLevel === 'Critical' || c.riskLevel === 'High' ? 'var(--danger)' : 'var(--success)'
                    }}>
                      {c.riskScore || 10}
                    </div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>
                        {c.containerId} &bull; <span style={{ color: 'var(--text-secondary)', fontWeight: 400, fontSize: '13px' }}>{c.cargoDescription}</span>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Status: <strong>{c.status}</strong> &bull; Location: {c.currentLocation} &bull; Vessel: {c.assignedShipName || 'Yard Staged'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span className={`badge ${
                      c.riskLevel === 'Critical' ? 'badge-red' :
                      c.riskLevel === 'High' ? 'badge-amber' :
                      c.riskLevel === 'Medium' ? 'badge-blue' : 'badge-green'
                    }`} style={{ fontSize: '12px' }}>
                      {c.riskLevel} Risk ({c.riskScore}/100)
                    </span>

                    <button
                      onClick={() => onSelectContainer(c)}
                      className="btn btn-outline btn-sm"
                    >
                      <span>View 360° Profile</span>
                    </button>
                  </div>
                </div>

                {/* Risk Reasons List */}
                <div style={{
                  background: 'var(--bg-card)',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-color)',
                  fontSize: '12px'
                }}>
                  <div style={{ fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px', textTransform: 'uppercase', fontSize: '10px' }}>
                    Evaluated Risk Factors:
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-primary)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    {(c.riskReasons || []).map((reason, rIdx) => (
                      <li key={rIdx}>{reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
