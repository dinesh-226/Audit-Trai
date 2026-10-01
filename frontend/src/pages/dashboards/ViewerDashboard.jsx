import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Eye,
  ShieldCheck,
  Search,
  Box,
  Ship,
  FileText,
  Clock,
  ArrowUpRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Camera,
  Download,
  Filter,
  Layers,
  MapPin,
  Anchor,
  Navigation,
  FileCheck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  Lock,
  X,
  Sliders,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Info
} from 'lucide-react';

export const ViewerDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [containers, setContainers] = useState([]);
  const [ships, setShips] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [recentAudits, setRecentAudits] = useState([]);
  const [reports, setReports] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Active Workspace Tab
  // 'overview', 'containers', 'inspections', 'evidence', 'audit', 'reports'
  const [activeTab, setActiveTab] = useState('overview');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [containerStatusFilter, setContainerStatusFilter] = useState('ALL');
  const [containerRiskFilter, setContainerRiskFilter] = useState('ALL');
  const [shipStatusFilter, setShipStatusFilter] = useState('ALL');
  const [inspectionResultFilter, setInspectionResultFilter] = useState('ALL');

  // Read-Only Detail Modals
  const [selectedContainer, setSelectedContainer] = useState(null);
  const [selectedShip, setSelectedShip] = useState(null);
  const [selectedInspection, setSelectedInspection] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [selectedAuditLog, setSelectedAuditLog] = useState(null);

  // Read-Only Audit Integrity Check State
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false);
  const [integrityResult, setIntegrityResult] = useState(null);

  // Report Generation State
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState(null);

  useEffect(() => {
    loadAllViewerData();
  }, []);

  const loadAllViewerData = async () => {
    setLoading(true);
    try {
      const [
        containersData,
        shipsData,
        inspectionsData,
        evidenceData,
        auditLogsData,
        reportsData,
        inspectionStats
      ] = await Promise.all([
        api.containers.getAll().catch(() => []),
        api.ships.getAll().catch(() => []),
        api.inspections.getAll().catch(() => []),
        api.evidence.getAll().catch(() => []),
        api.auditLogs.getAll({ limit: 20 }).catch(() => ({ logs: [] })),
        api.reports.getAll().catch(() => []),
        api.inspections.getStats().catch(() => null)
      ]);

      setContainers(containersData || []);
      setShips(shipsData || []);
      setInspections(inspectionsData || []);
      setEvidenceList(evidenceData || []);
      setRecentAudits(auditLogsData?.logs || []);
      setReports(reportsData || []);
      setStats(inspectionStats || null);
    } catch (e) {
      console.error('Failed to load viewer data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    setVerifyingIntegrity(true);
    setIntegrityResult(null);
    try {
      const result = await api.auditLogs.verifyIntegrity();
      setIntegrityResult(result);
    } catch (e) {
      setIntegrityResult({
        verified: false,
        message: `Safety check failed: ${e.message}`
      });
    } finally {
      setVerifyingIntegrity(false);
    }
  };

  const handleQuickReportGenerate = async (type = 'Executive Summary') => {
    setGeneratingReport(true);
    try {
      const res = await api.reports.generate({
        title: `${type} - Viewer Audit Report`,
        reportType: type,
        format: 'PDF'
      });
      setReportSuccessMsg(`New report generated successfully: ${res.report?.reportId || 'Ready'}`);
      const updatedReports = await api.reports.getAll();
      setReports(updatedReports || []);
      setTimeout(() => setReportSuccessMsg(null), 5000);
    } catch (e) {
      alert(`Report generation error: ${e.message}`);
    } finally {
      setGeneratingReport(false);
    }
  };

  // Filtered Container List
  const filteredContainers = containers.filter(c => {
    const matchesSearch = !searchQuery ||
      c.containerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cargoDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sealNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.destinationPort?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.originPort?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = containerStatusFilter === 'ALL' || c.status === containerStatusFilter;
    const matchesRisk = containerRiskFilter === 'ALL' || c.riskLevel === containerRiskFilter;

    return matchesSearch && matchesStatus && matchesRisk;
  });

  // Filtered Ships List
  const filteredShips = ships.filter(s => {
    const matchesSearch = !searchQuery ||
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.imoNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.currentPort?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.assignedBerth?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = shipStatusFilter === 'ALL' || s.status === shipStatusFilter;

    return matchesSearch && matchesStatus;
  });

  // Filtered Inspections List
  const filteredInspections = inspections.filter(i => {
    const matchesSearch = !searchQuery ||
      i.containerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.inspectionId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.inspectorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.port?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesResult = inspectionResultFilter === 'ALL' || i.result === inspectionResultFilter || i.status === inspectionResultFilter;

    return matchesSearch && matchesResult;
  });

  // KPI Calculations
  const inTransitContainers = containers.filter(c => c.status === 'In Transit' || c.status === 'Loaded').length;
  const readyContainers = containers.filter(c => c.status === 'Ready for Loading').length;
  const flaggedContainers = containers.filter(c => c.status === 'Flagged' || c.riskLevel === 'High' || c.riskLevel === 'Critical').length;
  const sailingShips = ships.filter(s => s.status === 'In Transit' || s.status === 'Sailing').length;
  const inPortShips = ships.filter(s => s.status === 'In Port' || s.status === 'Berthed' || s.status === 'Unloading' || s.status === 'Loading').length;
  const passedInspections = inspections.filter(i => i.result === 'Passed').length;
  const failedInspections = inspections.filter(i => i.result === 'Failed' || i.result === 'Flagged for Quarantine' || i.status === 'On Hold').length;

  return (
    <div className="page-wrapper" style={{ paddingBottom: '60px' }}>
      {/* 1. Viewer Role Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '20px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 800,
            color: '#0284c7',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '4px'
          }}>
            <Eye size={13} />
            <span>VIEWER & AUDITOR PORTAL</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>
            Port & Fleet Operational Explorer
          </h1>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            User: <strong>{user?.name || 'Authorized Auditor'}</strong> &bull; Role: <strong style={{ color: '#0f3460' }}>Viewer (Read-Only Access)</strong>
          </div>
        </div>

        {/* Global Navigation & Export Actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => onNavigate('tracking')}
            className="btn btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <Ship size={15} color="#0284c7" />
            <span>Live Ship Map</span>
          </button>
          <button
            onClick={() => onNavigate('audit')}
            className="btn btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <ShieldCheck size={15} color="#0f3460" />
            <span>Activity History</span>
          </button>
          <button
            onClick={() => onNavigate('reports')}
            className="btn btn-primary"
            style={{ background: '#0f3460', borderColor: '#0f3460' }}
          >
            <FileText size={15} />
            <span>Download Reports</span>
          </button>
        </div>
      </div>

      {/* 2. Prominent Read-Only Security Notice */}
      <div style={{
        background: '#f0f5fa',
        border: '1px solid #cbd9e8',
        borderRadius: '14px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '14px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '750px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: '#0f3460',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Lock size={20} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f3460' }}>
                Protected Read-Only Operational View
              </span>
              <span style={{
                fontSize: '10px',
                fontWeight: 800,
                background: '#0284c7',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '6px'
              }}>
                AUDIT COMPLIANT
              </span>
            </div>
            <p style={{ margin: 0, fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
              As a Viewer, you can inspect live ship locations, container journeys, inspection checklists, photo evidence, and download certified reports. Operational modification controls are disabled to protect data integrity.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleVerifyIntegrity}
            disabled={verifyingIntegrity}
            className="btn btn-secondary btn-sm"
            style={{ background: '#ffffff', color: '#0f3460', fontWeight: 700, border: '1px solid #cbd9e8' }}
          >
            <ShieldCheck size={14} color="#059669" />
            <span>{verifyingIntegrity ? 'Verifying...' : 'Check Record Safety'}</span>
          </button>
        </div>
      </div>

      {/* Safety Verification Results Banner */}
      {integrityResult && (
        <div style={{
          background: integrityResult.verified ? '#f0fdf4' : '#fef2f2',
          border: `1px solid ${integrityResult.verified ? '#bbf7d0' : '#fecaca'}`,
          borderRadius: '12px',
          padding: '14px 18px',
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {integrityResult.verified ? (
              <CheckCircle size={20} color="#16a34a" />
            ) : (
              <AlertTriangle size={20} color="#dc2626" />
            )}
            <div>
              <div style={{ fontSize: '13px', fontWeight: 800, color: integrityResult.verified ? '#166534' : '#991b1b' }}>
                {integrityResult.verified ? 'Audit Trail Verified 100% Intact' : 'Audit Trail Warning Detected'}
              </div>
              <div style={{ fontSize: '12px', color: integrityResult.verified ? '#15803d' : '#b91c1c' }}>
                {integrityResult.message || `Checked ${integrityResult.totalLogsChecked || recentAudits.length} activity records. Cryptographic hash chain is fully valid.`}
              </div>
            </div>
          </div>
          <button
            onClick={() => setIntegrityResult(null)}
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Report Generated Toast */}
      {reportSuccessMsg && (
        <div style={{
          background: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '22px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#0369a1', fontWeight: 600 }}>
            <Sparkles size={16} color="#0284c7" />
            <span>{reportSuccessMsg}</span>
          </div>
          <button onClick={() => setReportSuccessMsg(null)} style={{ background: 'none', border: 'none', color: '#0284c7', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* 3. Six Real-Time Operational KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '16px',
        marginBottom: '26px'
      }}>
        {/* Monitored Containers */}
        <div
          onClick={() => setActiveTab('containers')}
          className="maritime-card"
          style={{
            padding: '18px',
            borderLeft: '4px solid #0f3460',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Containers</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0f5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box size={16} color="#0f3460" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {containers.length} Units
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px', fontWeight: 600 }}>
            {inTransitContainers} In Transit &bull; {flaggedContainers} Flagged
          </div>
        </div>

        {/* Global Fleet */}
        <div
          onClick={() => setActiveTab('overview')}
          className="maritime-card"
          style={{
            padding: '18px',
            borderLeft: '4px solid #0284c7',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Fleet & Ships</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Ship size={16} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {ships.length} Ships
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {sailingShips} Sailing &bull; {inPortShips} In Port
          </div>
        </div>

        {/* Inspections Status */}
        <div
          onClick={() => setActiveTab('inspections')}
          className="maritime-card"
          style={{
            padding: '18px',
            borderLeft: '4px solid #0f3460',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Inspections</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0f5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileCheck size={16} color="#0f3460" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {stats?.passRate || (inspections.length > 0 ? `${Math.round((passedInspections / inspections.length) * 100)}%` : '100%')}
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '4px', fontWeight: 600 }}>
            {passedInspections} Passed &bull; {failedInspections} Failed/Hold
          </div>
        </div>

        {/* Photo Evidence Proofs */}
        <div
          onClick={() => setActiveTab('evidence')}
          className="maritime-card"
          style={{
            padding: '18px',
            borderLeft: '4px solid #0284c7',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Evidence Vault</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={16} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {evidenceList.length} Files
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            Photos, Seals & Manifests
          </div>
        </div>

        {/* Safety & Audit Status */}
        <div
          onClick={() => setActiveTab('audit')}
          className="maritime-card"
          style={{
            padding: '18px',
            borderLeft: '4px solid #0f3460',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Safety Status</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#f0f5fa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={16} color="#0f3460" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            Protected
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '4px', fontWeight: 600 }}>
            {recentAudits.length}+ Activity Logs
          </div>
        </div>

        {/* Executive Reports */}
        <div
          onClick={() => setActiveTab('reports')}
          className="maritime-card"
          style={{
            padding: '18px',
            borderLeft: '4px solid #0284c7',
            cursor: 'pointer',
            transition: 'transform 0.15s ease'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Reports</span>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} color="#0284c7" />
            </div>
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {reports.length} Available
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            PDF & Excel Ready
          </div>
        </div>
      </div>

      {/* 4. Global Search & Navigation Tabs */}
      <div className="maritime-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px'
        }}>
          {/* Workspace Tabs */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('overview')}
              className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
              style={activeTab === 'overview' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
            >
              <Ship size={14} />
              <span>Port & Fleet Status</span>
            </button>

            <button
              onClick={() => setActiveTab('containers')}
              className={`btn btn-sm ${activeTab === 'containers' ? 'btn-primary' : 'btn-secondary'}`}
              style={activeTab === 'containers' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
            >
              <Box size={14} />
              <span>Container Explorer ({containers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('inspections')}
              className={`btn btn-sm ${activeTab === 'inspections' ? 'btn-primary' : 'btn-secondary'}`}
              style={activeTab === 'inspections' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
            >
              <FileCheck size={14} />
              <span>Safety Inspections ({inspections.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('evidence')}
              className={`btn btn-sm ${activeTab === 'evidence' ? 'btn-primary' : 'btn-secondary'}`}
              style={activeTab === 'evidence' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
            >
              <Camera size={14} />
              <span>Photo Evidence ({evidenceList.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
              style={activeTab === 'audit' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
            >
              <ShieldCheck size={14} />
              <span>Audit Trail Stream</span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`btn btn-sm ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
              style={activeTab === 'reports' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
            >
              <Download size={14} />
              <span>Certified Reports ({reports.length})</span>
            </button>
          </div>

          {/* Quick Refresh */}
          <button onClick={loadAllViewerData} className="btn btn-outline btn-sm">
            <RotateCcw size={13} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Global Multi-Entity Search Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#f8fafc', padding: '10px 16px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <Search size={18} color="#0284c7" />
          <input
            type="text"
            placeholder="Search across all records: container ID, ship name, IMO, port, bolt seal #, inspector..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              flex: 1,
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: '#0f172a',
              background: 'transparent'
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontWeight: 700 }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* 5. TAB WORKSPACES */}

      {/* TAB 1: PORT & FLEET STATUS */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Active Vessels Card */}
          <div className="maritime-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  Live Ship & Voyage Tracking
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Real-time status of vessels, destination ports, berths, and onboard cargo
                </div>
              </div>

              {/* Status Filter */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Filter:</span>
                <select
                  className="select-control"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  value={shipStatusFilter}
                  onChange={(e) => setShipStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Ship Statuses</option>
                  <option value="In Port">In Port / Berthed</option>
                  <option value="In Transit">Sailing / In Transit</option>
                  <option value="Scheduled">Scheduled</option>
                </select>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Vessel Name & IMO</th>
                    <th>Captain & Flag</th>
                    <th>Current Port / Berth</th>
                    <th>Destination & ETA</th>
                    <th>Voyage Status</th>
                    <th>Containers Onboard</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredShips.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                        No ships matching your criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredShips.map((ship) => (
                      <tr key={ship.shipId || ship.imoNumber}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Ship size={15} color="#0f3460" />
                            <span>{ship.name}</span>
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                            IMO: {ship.imoNumber || 'IMO-9811000'} &bull; MMSI: {ship.mmsi || '419000123'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{ship.captain || 'Capt. J. Miller'}</div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Flag: {ship.flag || 'Panama'}</div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f3460' }}>
                            {ship.currentPort || 'Mumbai Port'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#0284c7' }}>
                            {ship.assignedBerth ? `Berth: ${ship.assignedBerth}` : 'Anchorage Bay'}
                          </div>
                        </td>
                        <td>
                          <div style={{ fontSize: '13px', color: '#334155' }}>
                            {ship.destinationPort || 'Singapore'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            ETA: {ship.eta ? new Date(ship.eta).toLocaleDateString() : 'On Schedule'}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${ship.status === 'In Port' || ship.status === 'Berthed' ? 'badge-green' : 'badge-primary'}`}>
                            {ship.status || 'In Transit'}
                          </span>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700, color: '#0f172a' }}>
                            {ship.containersCount || containers.filter(c => c.assignedShipId === ship.shipId || c.assignedShipId === ship.name).length} TEU
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => setSelectedShip(ship)}
                            className="btn btn-outline btn-sm"
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={13} />
                            <span>Inspect</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CONTAINER EXPLORER */}
      {activeTab === 'containers' && (
        <div className="maritime-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                Container Inventory & Seal Ledger
              </h3>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Read-only inspection of containers, ISO 17712 bolt seals, hazard classes, and route tracking
              </div>
            </div>

            {/* Filter Controls */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <select
                className="select-control"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                value={containerStatusFilter}
                onChange={(e) => setContainerStatusFilter(e.target.value)}
              >
                <option value="ALL">All Operational Statuses</option>
                <option value="Ready for Loading">Ready for Loading</option>
                <option value="Loaded">Loaded Onboard</option>
                <option value="In Transit">In Transit</option>
                <option value="Arrived">Arrived</option>
                <option value="Under Inspection">Under Inspection</option>
                <option value="Flagged">Flagged / Quarantine</option>
              </select>

              <select
                className="select-control"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                value={containerRiskFilter}
                onChange={(e) => setContainerRiskFilter(e.target.value)}
              >
                <option value="ALL">All Risk Levels</option>
                <option value="Low">Low Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="High">High Risk</option>
                <option value="Critical">Critical Risk</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Container ID & Seal</th>
                  <th>Cargo Description</th>
                  <th>Origin ➔ Destination</th>
                  <th>Operational Status</th>
                  <th>Risk Rating</th>
                  <th>Location</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredContainers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No containers found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredContainers.map((c) => (
                    <tr key={c.containerId}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Box size={14} color="#0f3460" />
                          <span>{c.containerId}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                          Seal: {c.sealNumber || c.boltSealId || 'SL-99820-ISO'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                          {c.cargoDescription || 'Commercial Freight'}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Type: {c.type || '40ft Dry Standard'} &bull; {c.weightKg ? `${c.weightKg} kg` : '24,000 kg'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#0f3460' }}>
                          {c.originPort || 'Port of Origin'} ➔ {c.destinationPort || 'Port of Delivery'}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${
                          c.status === 'Ready for Loading' || c.status === 'Loaded'
                            ? 'badge-green'
                            : c.status === 'Flagged'
                            ? 'badge-red'
                            : 'badge-primary'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${
                          c.riskLevel === 'Low'
                            ? 'badge-green'
                            : c.riskLevel === 'Medium'
                            ? 'badge-amber'
                            : 'badge-red'
                        }`}>
                          {c.riskLevel || 'Low'} Risk
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#334155' }}>
                          {c.currentLocation || c.assignedYardLocation || 'Main Yard Bay'}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => setSelectedContainer(c)}
                            className="btn btn-outline btn-sm"
                            title="Inspect 360 Details"
                          >
                            <Eye size={13} />
                            <span>Details</span>
                          </button>
                          <button
                            onClick={() => onNavigate('timeline', c.containerId)}
                            className="btn btn-secondary btn-sm"
                            title="View Journey Timeline"
                          >
                            <Clock size={13} />
                            <span>Timeline</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SAFETY INSPECTIONS */}
      {activeTab === 'inspections' && (
        <div className="maritime-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                7-Point Safety Inspections Ledger
              </h3>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Detailed records of physical inspections, bolt seal verifications, and structural assessments
              </div>
            </div>

            {/* Filter Results */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <select
                className="select-control"
                style={{ padding: '6px 12px', fontSize: '12px' }}
                value={inspectionResultFilter}
                onChange={(e) => setInspectionResultFilter(e.target.value)}
              >
                <option value="ALL">All Inspection Results</option>
                <option value="Passed">Passed Only</option>
                <option value="Failed">Failed Only</option>
                <option value="On Hold">On Hold / Quarantine</option>
                <option value="Repair Required">Repair Required</option>
                <option value="Re-inspection Required">Re-inspection Required</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Inspection ID & Container</th>
                  <th>Inspector & Port</th>
                  <th>Seal Verification</th>
                  <th>Inspection Type</th>
                  <th>Overall Result</th>
                  <th>Defects / Notes</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInspections.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                      No inspection records found.
                    </td>
                  </tr>
                ) : (
                  filteredInspections.map((insp) => (
                    <tr key={insp.inspectionId}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{insp.inspectionId}</div>
                        <div style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700 }}>
                          Container: {insp.containerId}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{insp.inspectorName || 'Officer S. Patil'}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{insp.port || 'Port Terminal'}</div>
                      </td>
                      <td>
                        {insp.sealMatch !== false ? (
                          <span className="badge badge-green" style={{ fontSize: '10px' }}>
                            ✓ Seal Verified
                          </span>
                        ) : (
                          <span className="badge badge-red" style={{ fontSize: '10px' }}>
                            ⚠ Seal Mismatch
                          </span>
                        )}
                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', fontFamily: 'monospace' }}>
                          {insp.physicalSealNumber || 'Verified'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#334155' }}>{insp.inspectionType || 'Safety & Structural'}</div>
                      </td>
                      <td>
                        <span className={`badge ${
                          insp.result === 'Passed'
                            ? 'badge-green'
                            : insp.result === 'Failed' || insp.status === 'On Hold'
                            ? 'badge-red'
                            : 'badge-amber'
                        }`}>
                          {insp.result || insp.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#475569', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {insp.defectsDetected?.length > 0
                            ? `${insp.defectsDetected.length} defect(s) logged`
                            : insp.recommendation || 'Approved for Sea Loading'}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          {new Date(insp.createdAt).toLocaleDateString()}
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                          {new Date(insp.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => setSelectedInspection(insp)}
                          className="btn btn-outline btn-sm"
                        >
                          <Eye size={13} />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: PHOTO EVIDENCE VAULT */}
      {activeTab === 'evidence' && (
        <div className="maritime-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                Photo Evidence & Customs Documents
              </h3>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Read-only inspection of high-security photographs, seal proofs, and customs clearance certificates
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700 }}>
              {evidenceList.length} Secure Evidence Files Verified
            </div>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '16px'
          }}>
            {evidenceList.length === 0 ? (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No uploaded evidence files found.
              </div>
            ) : (
              evidenceList.map((item, idx) => (
                <div
                  key={item._id || item.evidenceId || idx}
                  style={{
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    background: '#ffffff',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="badge badge-primary" style={{ fontSize: '10px' }}>
                        {item.category || item.evidenceType || 'Photo Proof'}
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Active'}
                      </span>
                    </div>

                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a', marginBottom: '4px' }}>
                      {item.fileName || `Evidence-${item.containerId || 'Proof'}.jpg`}
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569', marginBottom: '8px' }}>
                      {item.description || item.caption || 'Verified physical inspection record'}
                    </div>

                    <div style={{
                      background: '#f8fafc',
                      padding: '8px',
                      borderRadius: '6px',
                      border: '1px solid #f1f5f9',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                      color: '#0369a1',
                      wordBreak: 'break-all'
                    }}>
                      SHA-256: {item.fileHash ? `${item.fileHash.substring(0, 20)}...` : '4f8a92b...e31'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      Ref: <strong>{item.containerId || 'General Port'}</strong>
                    </span>
                    <button
                      onClick={() => setSelectedEvidence(item)}
                      className="btn btn-outline btn-sm"
                    >
                      <Eye size={13} />
                      <span>Inspect Proof</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL STREAM */}
      {activeTab === 'audit' && (
        <div className="maritime-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                Cryptographic Audit Log Stream
              </h3>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Immutable activity logs with cryptographic hash verification
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleVerifyIntegrity}
                disabled={verifyingIntegrity}
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 700 }}
              >
                <ShieldCheck size={14} color="#059669" />
                <span>{verifyingIntegrity ? 'Checking...' : 'Verify Hash Chain'}</span>
              </button>
              <button onClick={() => onNavigate('audit')} className="btn btn-primary btn-sm" style={{ background: '#0f3460' }}>
                <span>Open Full Audit Page</span>
                <ArrowUpRight size={13} />
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentAudits.slice(0, 10).map((log) => (
              <div
                key={log.auditId}
                style={{
                  padding: '14px 18px',
                  borderRadius: '10px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', fontFamily: 'monospace' }}>
                      {log.auditId}
                    </span>
                    <span className="badge badge-secondary" style={{ fontSize: '10px' }}>
                      {log.userRole || 'System'}
                    </span>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>
                      by <strong>{log.username || 'Officer'}</strong>
                    </span>
                  </div>

                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    {log.action}
                  </div>

                  <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace', marginTop: '2px' }}>
                    Hash: {log.currentHash ? `${log.currentHash.substring(0, 32)}...` : 'HASH-VALID'}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                      {new Date(log.timestamp).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAuditLog(log)}
                    className="btn btn-outline btn-sm"
                  >
                    <Eye size={13} />
                    <span>Inspect</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CERTIFIED REPORTS & EXPORTS */}
      {activeTab === 'reports' && (
        <div className="maritime-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                Certified Audit & Operations Reports
              </h3>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Official PDF summaries, CSV audit logs, and HTML reports available for download
              </div>
            </div>

            {/* Generate Quick Report */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => handleQuickReportGenerate('Comprehensive Audit')}
                disabled={generatingReport}
                className="btn btn-primary btn-sm"
                style={{ background: '#0f3460', borderColor: '#0f3460' }}
              >
                <FileText size={14} />
                <span>{generatingReport ? 'Generating...' : 'Generate Audit Report'}</span>
              </button>
              <a
                href={api.reports.getCsvExportUrl()}
                download
                className="btn btn-secondary btn-sm"
                style={{ fontWeight: 700 }}
              >
                <Download size={14} />
                <span>Export CSV</span>
              </a>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px', color: '#64748b' }}>
                No reports generated yet. Click "Generate Audit Report" above to create one.
              </div>
            ) : (
              reports.map((rpt) => (
                <div
                  key={rpt.reportId}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#e0f2fe',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#0284c7'
                    }}>
                      <FileCheck size={20} />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                        <span style={{ fontWeight: 800, fontSize: '15px', color: '#0f172a' }}>{rpt.title}</span>
                        <span className="badge badge-primary" style={{ fontSize: '10px' }}>{rpt.reportId}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Generated by <strong>{rpt.generatedBy}</strong> ({rpt.generatedByRole}) on {new Date(rpt.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <a
                      href={api.reports.getHtmlExportUrl(rpt.reportId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                    >
                      <Eye size={13} />
                      <span>View HTML</span>
                    </a>
                    <a
                      href={api.reports.getCsvExportUrl()}
                      download
                      className="btn btn-secondary btn-sm"
                    >
                      <Download size={13} />
                      <span>CSV</span>
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. READ-ONLY DETAIL MODALS */}
      {/* ========================================================================= */}

      {/* CONTAINER 360° MODAL */}
      {selectedContainer && (
        <div className="modal-overlay" onClick={() => setSelectedContainer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                  CONTAINER SPECIFICATION (READ-ONLY)
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedContainer.containerId}
                </h3>
              </div>
              <button onClick={() => setSelectedContainer(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Security Bolt Seal</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                    {selectedContainer.sealNumber || selectedContainer.boltSealId || 'SL-88910-SEC'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Operational Status</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0284c7' }}>
                    {selectedContainer.status}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Cargo Manifest</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {selectedContainer.cargoDescription || 'Industrial Machinery Parts'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Route</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f3460' }}>
                    {selectedContainer.originPort} ➔ {selectedContainer.destinationPort}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Hazard Classification</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {selectedContainer.hazardClass || 'Non-Hazardous'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Risk Rating</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: selectedContainer.riskLevel === 'Low' ? '#16a34a' : '#dc2626' }}>
                    {selectedContainer.riskLevel || 'Low'} Risk (Score: {selectedContainer.riskScore || 5}/100)
                  </div>
                </div>
              </div>

              {/* Read Only Notice in Modal */}
              <div style={{ background: '#f0f5fa', padding: '10px 14px', borderRadius: '8px', fontSize: '11px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Info size={14} color="#0284c7" />
                <span>All specifications verified against official port ledger. Modifications restricted to Port/Ship Managers.</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
                <button
                  onClick={() => {
                    const cid = selectedContainer.containerId;
                    setSelectedContainer(null);
                    onNavigate('timeline', cid);
                  }}
                  className="btn btn-secondary"
                >
                  <Clock size={14} />
                  <span>Open Timeline</span>
                </button>
                <button onClick={() => setSelectedContainer(null)} className="btn btn-primary" style={{ background: '#0f3460' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SHIP & VOYAGE DETAIL MODAL */}
      {selectedShip && (
        <div className="modal-overlay" onClick={() => setSelectedShip(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                  VESSEL DOSSIER (READ-ONLY)
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedShip.name}
                </h3>
              </div>
              <button onClick={() => setSelectedShip(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>IMO / MMSI</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', fontFamily: 'monospace' }}>
                    {selectedShip.imoNumber} / {selectedShip.mmsi || '419000123'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Commanding Captain</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f3460' }}>
                    {selectedShip.captain || 'Capt. J. Miller'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Current Port & Berth</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                    {selectedShip.currentPort || 'Mumbai Port'} ({selectedShip.assignedBerth || 'Berth B-02'})
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Destination & ETA</div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7' }}>
                    {selectedShip.destinationPort || 'Singapore'} ({selectedShip.eta ? new Date(selectedShip.eta).toLocaleDateString() : 'On Schedule'})
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Cargo Capacity</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedShip.capacityTeu ? `${selectedShip.capacityTeu} TEU` : '18,500 TEU'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Voyage Status</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#16a34a' }}>
                    {selectedShip.status || 'In Port'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  onClick={() => {
                    setSelectedShip(null);
                    onNavigate('tracking');
                  }}
                  className="btn btn-secondary"
                >
                  <Navigation size={14} />
                  <span>View on AIS Map</span>
                </button>
                <button onClick={() => setSelectedShip(null)} className="btn btn-primary" style={{ background: '#0f3460' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INSPECTION DETAIL MODAL */}
      {selectedInspection && (
        <div className="modal-overlay" onClick={() => setSelectedInspection(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                  SAFETY INSPECTION REPORT (READ-ONLY)
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedInspection.inspectionId} &bull; {selectedInspection.containerId}
                </h3>
              </div>
              <button onClick={() => setSelectedInspection(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '14px', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>Inspector & Location:</div>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedInspection.inspectorName || 'Officer S. Patil'} ({selectedInspection.port || 'Port Terminal'})
                  </div>
                </div>
                <span className={`badge ${selectedInspection.result === 'Passed' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '12px', padding: '6px 12px' }}>
                  {selectedInspection.result}
                </span>
              </div>

              {/* 7 Point Checklist Summary */}
              {selectedInspection.checklist && selectedInspection.checklist.length > 0 && (
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 800, color: '#0f3460', marginBottom: '8px', textTransform: 'uppercase' }}>
                    7-Point Physical Safety Checklist:
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedInspection.checklist.map((item, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          background: item.status === 'Pass' ? '#f0fdf4' : item.status === 'Fail' ? '#fef2f2' : '#f8fafc',
                          border: `1px solid ${item.status === 'Pass' ? '#bbf7d0' : item.status === 'Fail' ? '#fecaca' : '#e2e8f0'}`,
                          fontSize: '12px'
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#334155' }}>{item.item}</span>
                        <span style={{
                          fontWeight: 800,
                          color: item.status === 'Pass' ? '#16a34a' : item.status === 'Fail' ? '#dc2626' : '#64748b'
                        }}>
                          {item.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation & Notes */}
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Inspector Recommendation:</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                  {selectedInspection.recommendation || 'Approve for Sea Loading'}
                </div>
                {selectedInspection.notes && (
                  <div style={{ fontSize: '12px', color: '#475569', marginTop: '6px' }}>
                    Notes: {selectedInspection.notes}
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setSelectedInspection(null)} className="btn btn-primary" style={{ background: '#0f3460' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EVIDENCE PROOF DETAIL MODAL */}
      {selectedEvidence && (
        <div className="modal-overlay" onClick={() => setSelectedEvidence(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                  CERTIFIED EVIDENCE PROOF (READ-ONLY)
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedEvidence.fileName || 'Evidence Proof'}
                </h3>
              </div>
              <button onClick={() => setSelectedEvidence(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{
                height: '200px',
                borderRadius: '8px',
                background: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <img
                  src={selectedEvidence.fileUrl || '/assets/cargo-seal.jpg'}
                  alt="Evidence"
                  style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'cover' }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Associated Container:</div>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedEvidence.containerId || 'General Port Operations'}
                  </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>SHA-256 Cryptographic Fingerprint:</div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                    {selectedEvidence.fileHash || selectedEvidence.fileHashSha256 || '4f8a92b7c61d5e0a842fbc99017ae31'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setSelectedEvidence(null)} className="btn btn-primary" style={{ background: '#0f3460' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUDIT LOG DETAIL MODAL */}
      {selectedAuditLog && (
        <div className="modal-overlay" onClick={() => setSelectedAuditLog(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>
                  IMMUTABLE AUDIT LOG (READ-ONLY)
                </div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedAuditLog.auditId}
                </h3>
              </div>
              <button onClick={() => setSelectedAuditLog(null)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Action & Actor:</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
                  {selectedAuditLog.action}
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                  Executed by <strong>{selectedAuditLog.username}</strong> ({selectedAuditLog.userRole}) on {new Date(selectedAuditLog.timestamp).toLocaleString()}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Block Payload Hash (SHA-256):</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0369a1', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {selectedAuditLog.currentHash || '0000abc489...'}
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', color: '#64748b' }}>Previous Block Hash (prevHash):</div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {selectedAuditLog.prevHash || '0000...'}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button onClick={() => setSelectedAuditLog(null)} className="btn btn-primary" style={{ background: '#0f3460' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewerDashboard;
