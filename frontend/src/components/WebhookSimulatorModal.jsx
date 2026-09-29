import React, { useState } from 'react';
import { api } from '../services/api';
import { X, Zap, GitBranch, Server, CheckCircle2, AlertCircle } from 'lucide-react';

export const WebhookSimulatorModal = ({ onClose, onEventSent, projects = [] }) => {
  const [sourceType, setSourceType] = useState('jira');
  const [projectId, setProjectId] = useState(projects[0]?._id || '');
  const [issueKey, setIssueKey] = useState('PROJ-891');
  const [summary, setSummary] = useState('Database cluster read replica failover');
  const [action, setAction] = useState('UPDATE');
  const [field, setField] = useState('status');
  const [fromValue, setFromValue] = useState('In Progress');
  const [toValue, setToValue] = useState('Resolved');
  const [comment, setComment] = useState('Automated webhook trigger from CI/CD deployment pipeline');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      setSuccessMsg('');

      if (sourceType === 'jira') {
        await api.webhooks.sendJiraEvent({
          issueKey,
          summary,
          user: 'jira-webhook-sync@atlassian.net',
          userName: 'Atlassian Jira Bot',
          action,
          projectId: projectId || undefined,
          field,
          fromValue,
          toValue,
          comment
        });
      } else {
        await api.webhooks.sendGenericEvent({
          source: 'api',
          actorName: 'Cloud Monitoring Webhook',
          actorEmail: 'cloud-alerts@aws.amazon.com',
          action: 'UPDATE',
          entityType: 'Document',
          entityId: 'API-SEC-01',
          entityName: summary,
          projectId: projectId || undefined,
          fieldName: field,
          oldValue: fromValue,
          newValue: toValue,
          reason: comment
        });
      }

      setSuccessMsg('Webhook ingested successfully! Audit ledger updated.');
      if (onEventSent) onEventSent();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Webhook simulation failed');
    } finally {
      setLoading(false);
    }
  };

  const applyTemplate = (name) => {
    if (name === 'jira-pr') {
      setSourceType('jira');
      setIssueKey('JIRA-331');
      setSummary('OAuth Token Rotation API');
      setField('status');
      setFromValue('In Review');
      setToValue('Done');
      setComment('Merged PR #88 from feature/oauth branch by security lead');
    } else if (name === 'jira-blocker') {
      setSourceType('jira');
      setIssueKey('SEC-904');
      setSummary('Vulnerability CVE-2026-991 Detected');
      setField('priority');
      setFromValue('Medium');
      setToValue('Critical');
      setComment('Automated vulnerability scanner elevated severity to Critical');
    } else if (name === 'api-soc2') {
      setSourceType('api');
      setSummary('SOC2 Compliance Certificate Renewal');
      setField('complianceStatus');
      setFromValue('Pending Verification');
      setToValue('Verified & Certified');
      setComment('Automated audit robot ingested signed auditor credential artifact');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSend}>
          {/* Header */}
          <div className="modal-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(14, 165, 233, 0.15)',
                color: '#0ea5e9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Zap size={20} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Cross-Tool Webhook Ingestion Simulator</h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Simulate external events from Jira, GitHub, or REST APIs
                </div>
              </div>
            </div>
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="modal-body">
            {successMsg && (
              <div style={{
                background: 'var(--success-bg)',
                color: '#34d399',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} />
                <span>{successMsg}</span>
              </div>
            )}

            {error && (
              <div style={{
                background: 'var(--danger-bg)',
                color: '#f87171',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            {/* Quick Scenario Templates */}
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 700, marginBottom: '6px' }}>
                CLICK TO LOAD SAMPLE EVENT SCENARIO:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => applyTemplate('jira-pr')}
                >
                  <GitBranch size={13} /> Jira: PR Merge & Resolve
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => applyTemplate('jira-blocker')}
                >
                  <AlertCircle size={13} /> Jira: Blocker Security Incident
                </button>
                <button
                  type="button"
                  className="btn btn-outline btn-sm"
                  onClick={() => applyTemplate('api-soc2')}
                >
                  <Server size={13} /> REST API: SOC2 Verification
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="filter-input-group">
                <label className="filter-label">Integration Source</label>
                <select
                  className="form-control"
                  value={sourceType}
                  onChange={(e) => setSourceType(e.target.value)}
                >
                  <option value="jira">Jira Automation Webhook</option>
                  <option value="api">External REST API Ingest</option>
                </select>
              </div>

              <div className="filter-input-group">
                <label className="filter-label">Target Project Scope</label>
                <select
                  className="form-control"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  {projects.map((p) => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '0.75rem' }}>
              <div className="filter-input-group">
                <label className="filter-label">Issue Key / ID</label>
                <input
                  type="text"
                  className="form-control"
                  value={issueKey}
                  onChange={(e) => setIssueKey(e.target.value)}
                />
              </div>

              <div className="filter-input-group">
                <label className="filter-label">Event Summary</label>
                <input
                  type="text"
                  className="form-control"
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
              <div className="filter-input-group">
                <label className="filter-label">Field Changed</label>
                <input
                  type="text"
                  className="form-control"
                  value={field}
                  onChange={(e) => setField(e.target.value)}
                />
              </div>

              <div className="filter-input-group">
                <label className="filter-label">Old Value</label>
                <input
                  type="text"
                  className="form-control"
                  value={fromValue}
                  onChange={(e) => setFromValue(e.target.value)}
                />
              </div>

              <div className="filter-input-group">
                <label className="filter-label">New Value</label>
                <input
                  type="text"
                  className="form-control"
                  value={toValue}
                  onChange={(e) => setToValue(e.target.value)}
                />
              </div>
            </div>

            <div className="filter-input-group">
              <label className="filter-label">Webhook Payload Comment / Reason</label>
              <textarea
                className="form-control"
                rows="2"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              ></textarea>
            </div>
          </div>

          {/* Footer */}
          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary btn-sm">
              <Zap size={14} />
              <span>{loading ? 'Dispatching...' : 'Dispatch Webhook Event'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
