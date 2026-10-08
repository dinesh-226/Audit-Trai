import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  FileText,
  Plus,
  Download,
  Printer,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  RotateCcw,
  Calendar
} from 'lucide-react';

export const ReportsPage = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reportTitle, setReportTitle] = useState('Comprehensive Maritime Audit Trail Certificate');
  const [reportType, setReportType] = useState('Comprehensive Audit Trail');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const data = await api.reports.getAll();
      setReports(data || []);
      setLoadError('');
    } catch (e) {
      console.error(e);
      setReports([]);
      setLoadError(e.message || 'Failed to load reports.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      await api.reports.generate({
        title: reportTitle,
        reportType,
        format: 'PDF'
      });
      await fetchReports();
    } catch (e) {
      alert(`Error generating report: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenReportHtml = (reportId) => {
    window.open(api.reports.getHtmlExportUrl(reportId), '_blank');
  };

  const handleExportCsv = () => {
    window.open(api.reports.getCsvExportUrl(), '_blank');
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            REPORTS
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Activity Reports
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Create, view, and download audit reports and history logs
          </div>
        </div>

        <button onClick={handleExportCsv} className="btn btn-secondary">
          <Download size={16} />
          <span>Export All Logs CSV</span>
        </button>
      </div>

      {/* Report Generation Form Card */}
      <div className="maritime-card-glow" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>
          Create New Report
        </h3>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Report Title
            </label>
            <input
              type="text"
              className="input-control"
              value={reportTitle}
              onChange={(e) => setReportTitle(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Regulatory Framework / Type
            </label>
            <select
              className="select-control"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="Comprehensive Audit Trail">Comprehensive Audit Trail</option>
              <option value="Anomaly & Risk Assessment">Anomaly & Risk Assessment</option>
              <option value="Ship Voyage Activity">Ship Voyage Activity</option>
              <option value="Container Inspection & Compliance">Container Inspection & Compliance</option>
              <option value="Tamper Verification Certificate">Tamper Verification Certificate</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button
            onClick={handleGenerateReport}
            disabled={generating}
            className="btn btn-primary"
          >
            <FileText size={16} />
            <span>{generating ? 'Compiling Report & Verifying Ledger...' : 'Generate & Stamp Report'}</span>
          </button>
        </div>
      </div>

      {/* Generated Reports List */}
      <div className="maritime-card" style={{ padding: '24px' }}>
        <h3 style={{ margin: '0 0 18px 0', fontSize: '16px', fontWeight: 700 }}>
          Historical Generated Reports & Certificates
        </h3>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading reports...
          </div>
        ) : loadError ? (
          <div role="alert" style={{ textAlign: 'center', padding: '40px', color: '#991b1b' }}>
            Unable to load reports: {loadError}
          </div>
        ) : reports.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            No formal reports generated yet. Use the form above to compile a certificate.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '18px' }}>
            {reports.map((rpt) => (
              <div
                key={rpt.reportId}
                style={{
                  padding: '20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '14px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--cyan)', fontWeight: 700 }}>
                      {rpt.reportId}
                    </span>
                    <span
                      className="badge"
                      style={{
                        background: rpt.integrityStatus === 'VERIFIED' ? '#dcfce7' : '#fef3c7',
                        color: rpt.integrityStatus === 'VERIFIED' ? '#166534' : '#92400e'
                      }}
                    >
                      {rpt.integrityStatus || 'NOT CHECKED'}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                    {rpt.title}
                  </h4>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                    Framework: <strong>{rpt.reportType}</strong>
                  </div>

                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    fontSize: '11px',
                    background: 'var(--bg-card)',
                    padding: '10px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-color)'
                  }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Events Covered:</span>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{rpt.metricsSummary?.totalAudits || 0}</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Security Check:</span>
                      <div style={{ fontWeight: 700, color: rpt.metricsSummary?.integrityVerified ? '#10b981' : '#92400e' }}>
                        {rpt.metricsSummary?.totalAudits > 0
                          ? rpt.metricsSummary.integrityVerified ? 'Chain verified' : 'Not verified'
                          : 'No audit events'}
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontSize: '11px', color: 'var(--text-muted)' }}>
                  <span>Generated: {new Date(rpt.createdAt).toLocaleDateString()}</span>
                  <button
                    onClick={() => handleOpenReportHtml(rpt.reportId)}
                    className="btn btn-primary btn-sm"
                  >
                    <Printer size={13} />
                    <span>View / Print PDF</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
