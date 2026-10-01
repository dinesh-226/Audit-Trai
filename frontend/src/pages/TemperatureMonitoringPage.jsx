import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SummaryCard } from '../components/analytics/SummaryCard';
import { ChartCard } from '../components/analytics/ChartCard';
import {
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  Box,
  Layers,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Sliders,
  Lock,
  Download,
  FileText,
  Ship,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  X,
  Zap,
  Radio,
  Cpu,
  Eye
} from 'lucide-react';

export const TemperatureMonitoringPage = ({ onNavigate }) => {
  const { user, hasRole } = useAuth();

  // Active Screen / View: 'overview', 'details', 'analytics', 'incidents'
  const [activeView, setActiveView] = useState('overview');

  // Filter & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [portFilter, setPortFilter] = useState('ALL');
  const [cargoFilter, setCargoFilter] = useState('ALL');

  // Data State
  const [overviewData, setOverviewData] = useState(null);
  const [containersList, setContainersList] = useState([]);
  const [selectedContainerId, setSelectedContainerId] = useState('MSCU-8829104');
  const [selectedContainerDetail, setSelectedContainerDetail] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddReadingModal, setShowAddReadingModal] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showChecklistModal, setShowChecklistModal] = useState(false);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState(null);

  // Forms State
  const [readingForm, setReadingForm] = useState({
    temperature: '',
    humidity: '85',
    powerStatus: 'Connected / Grid',
    source: 'Manual Inspection',
    isCorrection: false,
    correctionReason: '',
    notes: ''
  });

  const [configForm, setConfigForm] = useState({
    cargoType: '',
    targetTemperature: -18,
    minTemperature: -22,
    maxTemperature: -16,
    sensorId: '',
    sensorModel: '',
    powerStatus: 'Connected / Grid'
  });

  const [holdForm, setHoldForm] = useState({
    holdReason: 'Critical thermal excursion: Temperature exceeded threshold for >30 minutes'
  });

  const [resolveForm, setResolveForm] = useState({
    correctiveAction: 'Connected to emergency 440V auxiliary shore power. Compressor rebooted.',
    reinspectionRequired: true,
    notes: ''
  });

  const [checklistForm, setChecklistForm] = useState({
    result: 'Pass',
    notes: 'Reefer compressor operational and temperature stabilizing within setpoints.',
    items: [
      { item: '1. Reefer Machinery Power Cable & Plug Integrity', status: 'Pass', notes: 'Gland secure, 440V verified' },
      { item: '2. Microprocessor Setpoint vs External Digital Display', status: 'Pass', notes: 'Zero discrepancy' },
      { item: '3. Air Supply & Return Duct Temperature Gradient', status: 'Pass', notes: 'ΔT < 1.5°C normal' },
      { item: '4. De-icing & Condenser Coil Frost Level', status: 'Pass', notes: 'No ice buildup' },
      { item: '5. Door Gasket Thermal Seal & Vacuum Lock', status: 'Pass', notes: 'Airtight rubber seal' },
      { item: '6. Drain Plugs & Floor T-Bar Airflow Clearance', status: 'Pass', notes: 'Clear air channels' }
    ]
  });

  const [notification, setNotification] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadAllTemperatureData();
  }, [portFilter, statusFilter, cargoFilter]);

  const showNotice = (msg, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadAllTemperatureData = async () => {
    setLoading(true);
    try {
      const [overviewRes, containersRes, analyticsRes] = await Promise.all([
        api.temperature.getOverview({ port: portFilter }),
        api.temperature.getContainers({ port: portFilter, status: statusFilter, cargoType: cargoFilter }),
        api.temperature.getAnalytics()
      ]);

      setOverviewData(overviewRes);
      setContainersList(containersRes || []);
      setAnalyticsData(analyticsRes);

      if (selectedContainerId) {
        loadContainerDetail(selectedContainerId);
      } else if (containersRes && containersRes.length > 0) {
        setSelectedContainerId(containersRes[0].containerId);
        loadContainerDetail(containersRes[0].containerId);
      }
    } catch (e) {
      console.error('Failed to load temperature data:', e);
    } finally {
      setLoading(false);
    }
  };

  const loadContainerDetail = async (cid) => {
    try {
      const res = await api.temperature.getContainerById(cid);
      setSelectedContainerDetail(res);
      if (res.reefer) {
        setConfigForm({
          cargoType: res.reefer.cargoType,
          targetTemperature: res.reefer.targetTemperature,
          minTemperature: res.reefer.minTemperature,
          maxTemperature: res.reefer.maxTemperature,
          sensorId: res.reefer.sensorId || 'REEFER-IOT-9021',
          sensorModel: res.reefer.sensorModel || 'Carrier Transicold DataCOLD 600',
          powerStatus: res.reefer.powerStatus || 'Connected / Grid'
        });
      }
    } catch (e) {
      console.error('Failed to load container detail:', e);
    }
  };

  const handleSelectContainer = (cid) => {
    setSelectedContainerId(cid);
    loadContainerDetail(cid);
    setActiveView('details');
  };

  // Add Reading
  const handleSaveReading = async () => {
    if (!readingForm.temperature || isNaN(Number(readingForm.temperature))) {
      showNotice('Please enter a valid numeric temperature reading.', true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.temperature.addReading(selectedContainerId, readingForm);
      showNotice(res.message || 'Temperature reading recorded and added to audit ledger.');
      setShowAddReadingModal(false);
      setReadingForm({
        temperature: '',
        humidity: '85',
        powerStatus: 'Connected / Grid',
        source: 'Manual Inspection',
        isCorrection: false,
        correctionReason: '',
        notes: ''
      });
      await loadAllTemperatureData();
      await loadContainerDetail(selectedContainerId);
    } catch (e) {
      showNotice(e.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // Simulate Next Step
  const handleSimulateStep = async () => {
    setActionLoading(true);
    try {
      const res = await api.temperature.simulateReading(selectedContainerId);
      showNotice(`Simulated reading recorded: ${res.currentTemperature}°C`);
      await loadAllTemperatureData();
      await loadContainerDetail(selectedContainerId);
    } catch (e) {
      showNotice(e.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // Save Profile Configuration (Admin Only)
  const handleSaveConfig = async () => {
    setActionLoading(true);
    try {
      const res = await api.temperature.updateProfile(selectedContainerId, configForm);
      showNotice(res.message || 'Setpoints updated successfully.');
      setShowConfigModal(false);
      await loadAllTemperatureData();
      await loadContainerDetail(selectedContainerId);
    } catch (e) {
      showNotice(e.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // Place on Quarantine Hold
  const handlePlaceHold = async () => {
    setActionLoading(true);
    try {
      const res = await api.temperature.placeHold(selectedContainerId, holdForm);
      showNotice(res.message || 'Reefer placed on cold-chain quarantine hold.');
      setShowHoldModal(false);
      await loadAllTemperatureData();
      await loadContainerDetail(selectedContainerId);
    } catch (e) {
      showNotice(e.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // Acknowledge Incident
  const handleAcknowledge = async (incId) => {
    setActionLoading(true);
    try {
      const res = await api.temperature.acknowledgeIncident(incId);
      showNotice(res.message || 'Incident acknowledged.');
      await loadAllTemperatureData();
      if (selectedContainerId) await loadContainerDetail(selectedContainerId);
    } catch (e) {
      showNotice(e.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // Resolve Incident
  const handleResolveIncident = async () => {
    if (!selectedIncident) return;
    setActionLoading(true);
    try {
      const res = await api.temperature.resolveIncident(selectedIncident.incidentId, resolveForm);
      showNotice(res.message || 'Corrective action recorded.');
      setShowResolveModal(false);
      setSelectedIncident(null);
      await loadAllTemperatureData();
      if (selectedContainerId) await loadContainerDetail(selectedContainerId);
    } catch (e) {
      showNotice(e.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Reefer Checklist
  const handleSubmitChecklist = async () => {
    setActionLoading(true);
    try {
      const res = await api.temperature.submitInspection(selectedContainerId, {
        checklist: checklistForm.items,
        result: checklistForm.result,
        notes: checklistForm.notes,
        evidencePhotos: [
          { fileName: `${selectedContainerId}-reefer-proof.jpg`, caption: 'Compressor thermal seal inspection' }
        ]
      });
      showNotice(res.message || 'Reefer safety inspection recorded.');
      setShowChecklistModal(false);
      await loadAllTemperatureData();
      await loadContainerDetail(selectedContainerId);
    } catch (e) {
      showNotice(e.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered Container List for Table
  const filteredContainers = containersList.filter(c => {
    const matchesSearch = !searchQuery ||
      c.containerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.cargoType?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sensorId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Extract all incidents for View 4
  const allIncidents = [];
  containersList.forEach(c => {
    if (c.incidents && c.incidents.length > 0) {
      c.incidents.forEach(inc => {
        allIncidents.push({ ...inc, containerId: c.containerId, cargoType: c.cargoType, location: c.location });
      });
    }
  });

  return (
    <div className="page-wrapper" style={{ paddingBottom: '60px' }}>
      {/* 1. Header */}
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
            <Thermometer size={14} />
            <span>COLD-CHAIN AUDIT & REEFER TEMPERATURE MONITORING</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>
            Refrigerated Container Temperature Control
          </h1>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Role: <strong style={{ color: '#0f3460' }}>{user?.role?.toUpperCase()}</strong> &bull; Mode: <strong style={{ color: '#0284c7' }}>Manual/Simulated Monitoring</strong> (Cold-Chain IoT Telemetry)
          </div>
        </div>

        {/* Global Export & Actions */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a
            href={api.temperature.getCsvExportUrl()}
            download
            className="btn btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </a>
          <button
            onClick={() => onNavigate ? onNavigate('reports') : null}
            className="btn btn-primary"
            style={{ background: '#0f3460', borderColor: '#0f3460' }}
          >
            <FileText size={15} />
            <span>Cold-Chain Reports</span>
          </button>
        </div>
      </div>

      {/* Mode / Accuracy Transparency Banner */}
      <div style={{
        background: '#f0f5fa',
        border: '1px solid #cbd9e8',
        borderRadius: '14px',
        padding: '14px 18px',
        marginBottom: '22px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '8px',
            background: '#0f3460',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Cpu size={18} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f3460' }}>
              Manual & Simulated Telemetry Verification Mode
            </div>
            <div style={{ fontSize: '12px', color: '#475569' }}>
              Readings represent verified physical inspector probes and simulated IoT sensor data streams. Historical entries are immutable and cryptographically audited.
            </div>
          </div>
        </div>
        <span className="badge badge-primary" style={{ fontSize: '11px', padding: '4px 10px' }}>
          ISO 1496-2 COMPLIANT
        </span>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div style={{
          background: notification.isError ? '#fef2f2' : '#f0fdf4',
          border: `1px solid ${notification.isError ? '#fecaca' : '#bbf7d0'}`,
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: notification.isError ? '#991b1b' : '#166534',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {notification.isError ? <AlertCircle size={16} color="#dc2626" /> : <CheckCircle size={16} color="#16a34a" />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* 2. Four Main Screen Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '22px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveView('overview')}
          className={`btn btn-sm ${activeView === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          style={activeView === 'overview' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
        >
          <Thermometer size={14} />
          <span>View 1: Temperature Overview</span>
        </button>

        <button
          onClick={() => setActiveView('details')}
          className={`btn btn-sm ${activeView === 'details' ? 'btn-primary' : 'btn-secondary'}`}
          style={activeView === 'details' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
        >
          <Box size={14} />
          <span>View 2: Container Temperature Details</span>
        </button>

        <button
          onClick={() => setActiveView('analytics')}
          className={`btn btn-sm ${activeView === 'analytics' ? 'btn-primary' : 'btn-secondary'}`}
          style={activeView === 'analytics' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
        >
          <Layers size={14} />
          <span>View 3: Temperature Analytics</span>
        </button>

        <button
          onClick={() => setActiveView('incidents')}
          className={`btn btn-sm ${activeView === 'incidents' ? 'btn-primary' : 'btn-secondary'}`}
          style={activeView === 'incidents' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
        >
          <AlertTriangle size={14} />
          <span>View 4: Alerts & Incidents ({allIncidents.length})</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SCREEN 1: TEMPERATURE OVERVIEW */}
      {/* ========================================================================= */}
      {activeView === 'overview' && overviewData && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '14px'
          }}>
            <SummaryCard {...overviewData.summary.totalReefers} isClickable={false} />
            <SummaryCard {...overviewData.summary.normalStatus} isClickable={false} />
            <SummaryCard {...overviewData.summary.warningStatus} isClickable={false} />
            <SummaryCard {...overviewData.summary.criticalStatus} isClickable={false} />
            <SummaryCard {...overviewData.summary.offlineSensors} isClickable={false} />
            <SummaryCard {...overviewData.summary.quarantineHold} isClickable={false} />
            <SummaryCard {...overviewData.summary.averageTemp} isClickable={false} />
            <SummaryCard {...overviewData.summary.openIncidents} isClickable={false} />
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
            <ChartCard
              title="Cold-Chain Sensor Status Distribution"
              subtitle="Reefer units in normal range vs warnings vs critical excursions"
              type="doughnut"
              data={overviewData.charts.statusDistribution}
            />

            <ChartCard
              title="24-Hour Fleet Temperature Alert Trend"
              subtitle="Compliant units vs thermal excursions over time"
              type="line"
              data={overviewData.charts.alertTrends}
              unit="Units"
            />
          </div>

          {/* Container Status Table */}
          <div className="maritime-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  Monitored Refrigerated Containers
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Real-time thermal status, power connection, setpoints, and yard locations
                </div>
              </div>

              {/* Filters */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <select
                  className="select-control"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Normal">Normal In-Spec</option>
                  <option value="Warning">Warning Excursion</option>
                  <option value="Critical">Critical Excursion</option>
                  <option value="On Hold">On Quarantine Hold</option>
                </select>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <Search size={14} color="#64748b" />
                  <input
                    type="text"
                    placeholder="Search container ID, cargo, sensor..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '12px', width: '160px' }}
                  />
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Container ID & Sensor</th>
                    <th>Cargo Type</th>
                    <th>Current Temp</th>
                    <th>Target / Range</th>
                    <th>Power Source</th>
                    <th>Status</th>
                    <th>Location</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContainers.map((c) => (
                    <tr key={c.containerId}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Box size={14} color="#0f3460" />
                          <span>{c.containerId}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', fontFamily: 'monospace' }}>
                          Sensor: {c.sensorId} ({c.sensorModel?.substring(0, 16)}...)
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>{c.cargoType}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '16px', fontWeight: 800, color: c.sensorStatus === 'Normal' ? '#16a34a' : c.sensorStatus === 'Warning' ? '#d97706' : '#dc2626' }}>
                          {c.currentTemperature > 0 ? `+${c.currentTemperature}` : c.currentTemperature}°C
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Humidity: {c.humidityPercent || 85}%</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                          Target: {c.targetTemperature}°C
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          Range: [{c.minTemperature}°C to {c.maxTemperature}°C]
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#334155' }}>{c.powerStatus}</div>
                      </td>
                      <td>
                        <span className={`badge ${
                          c.sensorStatus === 'Normal' ? 'badge-green' : c.sensorStatus === 'Warning' ? 'badge-amber' : 'badge-red'
                        }`}>
                          {c.sensorStatus}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: '#475569' }}>{c.location}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          onClick={() => handleSelectContainer(c.containerId)}
                          className="btn btn-primary btn-sm"
                          style={{ background: '#0f3460', borderColor: '#0f3460' }}
                        >
                          <Eye size={13} />
                          <span>Inspect 360°</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 2: CONTAINER TEMPERATURE DETAILS */}
      {/* ========================================================================= */}
      {activeView === 'details' && selectedContainerDetail && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Top Profile Header Card */}
          <div className="maritime-card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>
                    {selectedContainerDetail.reefer.containerId}
                  </h2>
                  <span className={`badge ${
                    selectedContainerDetail.reefer.sensorStatus === 'Normal' ? 'badge-green' : selectedContainerDetail.reefer.sensorStatus === 'Warning' ? 'badge-amber' : 'badge-red'
                  }`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                    {selectedContainerDetail.reefer.sensorStatus}
                  </span>
                  {selectedContainerDetail.reefer.isQuarantineHold && (
                    <span className="badge badge-red" style={{ fontSize: '12px', padding: '4px 10px' }}>
                      QUARANTINE HOLD ACTIVE
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                  Cargo: <strong>{selectedContainerDetail.reefer.cargoType}</strong> &bull; Location: <strong>{selectedContainerDetail.reefer.location}</strong> &bull; Power: <strong>{selectedContainerDetail.reefer.powerStatus}</strong>
                </div>
              </div>

              {/* Action Buttons (RBAC Gated) */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {hasRole('admin', 'inspector', 'port_manager') && (
                  <button onClick={() => setShowAddReadingModal(true)} className="btn btn-primary btn-sm" style={{ background: '#0284c7', borderColor: '#0284c7' }}>
                    <Plus size={14} />
                    <span>Record Reading</span>
                  </button>
                )}

                <button onClick={handleSimulateStep} disabled={actionLoading} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
                  <Radio size={14} color="#0284c7" />
                  <span>Simulate Next Step</span>
                </button>

                {hasRole('admin', 'inspector') && (
                  <button onClick={() => setShowChecklistModal(true)} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
                    <CheckCircle2 size={14} color="#16a34a" />
                    <span>Reefer Checklist</span>
                  </button>
                )}

                {hasRole('admin', 'port_manager', 'inspector') && !selectedContainerDetail.reefer.isQuarantineHold && (
                  <button onClick={() => setShowHoldModal(true)} className="btn btn-outline btn-sm" style={{ borderColor: '#fca5a5', color: '#dc2626' }}>
                    <Lock size={14} />
                    <span>Quarantine Hold</span>
                  </button>
                )}

                {hasRole('admin') && (
                  <button onClick={() => setShowConfigModal(true)} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
                    <Sliders size={14} />
                    <span>Setpoints</span>
                  </button>
                )}
              </div>
            </div>

            {/* Setpoint & Current Temperature Gauge Strip */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '12px',
              background: '#f8fafc',
              padding: '16px',
              borderRadius: '12px',
              border: '1px solid #e2e8f0'
            }}>
              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Current Live Temp</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: selectedContainerDetail.reefer.sensorStatus === 'Normal' ? '#16a34a' : '#dc2626' }}>
                  {selectedContainerDetail.reefer.currentTemperature > 0 ? `+${selectedContainerDetail.reefer.currentTemperature}` : selectedContainerDetail.reefer.currentTemperature}°C
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Target Setpoint</div>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f3460' }}>
                  {selectedContainerDetail.reefer.targetTemperature}°C
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Permitted Excursion Band</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#0284c7' }}>
                  {selectedContainerDetail.reefer.minTemperature}°C ➔ {selectedContainerDetail.reefer.maxTemperature}°C
                </div>
              </div>

              <div>
                <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Telemetry Sensor ID</div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#334155', fontFamily: 'monospace' }}>
                  {selectedContainerDetail.reefer.sensorId}
                </div>
              </div>
            </div>
          </div>

          {/* Temperature History Line Graph */}
          {selectedContainerDetail.historyChart && (
            <ChartCard
              title="24-Hour Telemetry Temperature History"
              subtitle="Recorded temperature vs target setpoint and permitted excursion threshold bands"
              type="line"
              data={selectedContainerDetail.historyChart}
              unit="°C"
              height={260}
            />
          )}

          {/* Historical Readings Table */}
          <div className="maritime-card" style={{ padding: '24px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
              Historical Temperature & Probe Log Entries
            </h3>

            <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
              <table className="table" style={{ width: '100%', fontSize: '12px' }}>
                <thead>
                  <tr>
                    <th>Log ID & Timestamp</th>
                    <th>Temperature</th>
                    <th>Humidity</th>
                    <th>Source / Probe</th>
                    <th>Power Source</th>
                    <th>Compliance Status</th>
                    <th>Recorded By</th>
                  </tr>
                </thead>
                <tbody>
                  {(selectedContainerDetail.reefer.readings || []).slice().reverse().map((r, idx) => (
                    <tr key={r.readingId || idx}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{new Date(r.recordedAt).toLocaleTimeString()}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{new Date(r.recordedAt).toLocaleDateString()}</div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 800, fontSize: '14px', color: r.status === 'Normal' ? '#16a34a' : '#dc2626' }}>
                          {r.temperature > 0 ? `+${r.temperature}` : r.temperature}°C
                        </span>
                      </td>
                      <td>{r.humidity}%</td>
                      <td>
                        <span style={{ color: '#0369a1', fontWeight: 600 }}>{r.source}</span>
                        {r.isCorrection && <span className="badge badge-amber" style={{ marginLeft: '6px', fontSize: '10px' }}>CORRECTION</span>}
                      </td>
                      <td>{r.powerStatus}</td>
                      <td>
                        <span className={`badge ${r.status === 'Normal' ? 'badge-green' : r.status === 'Warning' ? 'badge-amber' : 'badge-red'}`}>
                          {r.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.recordedBy}</div>
                        <div style={{ fontSize: '10px', color: '#94a3b8' }}>{r.userRole}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 3: TEMPERATURE ANALYTICS */}
      {/* ========================================================================= */}
      {activeView === 'analytics' && analyticsData && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          <ChartCard
            title="Thermal Excursions by Port & Bay"
            subtitle="Incident frequency per terminal location"
            type="bar"
            data={analyticsData.excursionsByPort}
            unit="Events"
          />

          <ChartCard
            title="Average Temperature by Cargo Commodity"
            subtitle="Deep frozen vs pharma vs fresh produce cold-chain"
            type="bar"
            data={analyticsData.avgTempByCommodity}
            unit="°C"
          />

          <ChartCard
            title="Repeated Incident Frequency by Root Cause"
            subtitle="Power disconnects, compressor trips, and gasket leaks"
            type="horizontalBar"
            data={analyticsData.repeatedIncidents}
            unit="Cases"
          />

          <ChartCard
            title="Reefer Safety Inspection Compliance Rate"
            subtitle="Passed vs maintenance required vs quarantine holds"
            type="doughnut"
            data={analyticsData.inspectionPassRate}
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* SCREEN 4: ALERTS AND INCIDENTS HUB */}
      {/* ========================================================================= */}
      {activeView === 'incidents' && (
        <div className="maritime-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                Cold-Chain Thermal Excursion Incidents
              </h3>
              <div style={{ fontSize: '12px', color: '#64748b' }}>
                Review, acknowledge, record corrective actions, and schedule re-inspections
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {allIncidents.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
                No active thermal excursion incidents recorded. All cold-chains in spec.
              </div>
            ) : (
              allIncidents.map((inc) => (
                <div
                  key={inc.incidentId}
                  style={{
                    padding: '18px',
                    borderRadius: '12px',
                    background: '#ffffff',
                    border: `1px solid ${inc.severity === 'Critical' ? '#fecaca' : '#fed7aa'}`,
                    borderLeft: `5px solid ${inc.severity === 'Critical' ? '#dc2626' : '#f59e0b'}`,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '14px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{inc.containerId}</span>
                      <span className={`badge ${inc.severity === 'Critical' ? 'badge-red' : 'badge-amber'}`}>{inc.severity} Excursion</span>
                      <span className="badge badge-secondary">{inc.status}</span>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>{new Date(inc.detectedAt).toLocaleString()}</span>
                    </div>

                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f3460', marginBottom: '4px' }}>
                      {inc.excursionType}: Recorded {inc.recordedTemperature}°C (Permitted: {inc.permittedRange})
                    </div>

                    <div style={{ fontSize: '12px', color: '#475569' }}>
                      {inc.notes || 'Investigating cold-chain integrity.'}
                    </div>

                    {inc.correctiveAction && (
                      <div style={{ fontSize: '12px', color: '#166534', marginTop: '6px', background: '#f0fdf4', padding: '6px 10px', borderRadius: '6px' }}>
                        ✓ Corrective Action: <strong>{inc.correctiveAction}</strong> (by {inc.resolvedBy})
                      </div>
                    )}
                  </div>

                  {/* Incident Resolution Buttons */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {hasRole('admin', 'port_manager') && inc.status === 'New' && (
                      <button
                        onClick={() => handleAcknowledge(inc.incidentId)}
                        disabled={actionLoading}
                        className="btn btn-secondary btn-sm"
                        style={{ fontWeight: 700 }}
                      >
                        <CheckCircle size={13} color="#0284c7" />
                        <span>Acknowledge</span>
                      </button>
                    )}

                    {hasRole('admin', 'port_manager', 'inspector') && inc.status !== 'Resolved' && inc.status !== 'Closed' && (
                      <button
                        onClick={() => {
                          setSelectedIncident(inc);
                          setShowResolveModal(true);
                        }}
                        className="btn btn-primary btn-sm"
                        style={{ background: '#0f3460', borderColor: '#0f3460' }}
                      >
                        <ShieldCheck size={13} />
                        <span>Record Action</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Add Reading Modal */}
      {showAddReadingModal && (
        <div className="modal-overlay" onClick={() => setShowAddReadingModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                Record Temperature Reading: {selectedContainerId}
              </h3>
              <button onClick={() => setShowAddReadingModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Recorded Temperature (°C):
                </label>
                <input
                  type="number"
                  step="0.1"
                  className="input-control"
                  placeholder="e.g. -19.5"
                  value={readingForm.temperature}
                  onChange={(e) => setReadingForm({ ...readingForm, temperature: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Source / Probe Type:
                </label>
                <select
                  className="select-control"
                  value={readingForm.source}
                  onChange={(e) => setReadingForm({ ...readingForm, source: e.target.value })}
                >
                  <option value="Manual Inspection">Manual Physical Probe</option>
                  <option value="Handheld Thermometer Probe">Calibrated Digital Thermometer</option>
                  <option value="Simulated IoT Stream">Simulated IoT Stream</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Reefer Power Source:
                </label>
                <select
                  className="select-control"
                  value={readingForm.powerStatus}
                  onChange={(e) => setReadingForm({ ...readingForm, powerStatus: e.target.value })}
                >
                  <option value="Connected / Grid">Connected / Shore Grid</option>
                  <option value="Genset Active">Active Genset</option>
                  <option value="Battery Backup">Battery Backup</option>
                  <option value="Disconnected / Offline">Disconnected / Offline</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="correctionCheck"
                  checked={readingForm.isCorrection}
                  onChange={(e) => setReadingForm({ ...readingForm, isCorrection: e.target.checked })}
                />
                <label htmlFor="correctionCheck" style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  This is a correction of a previous misreading
                </label>
              </div>

              {readingForm.isCorrection && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Correction Reason (Immutable Audit Note):
                  </label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. Probe recalibrated against ice bath standard"
                    value={readingForm.correctionReason}
                    onChange={(e) => setReadingForm({ ...readingForm, correctionReason: e.target.value })}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setShowAddReadingModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSaveReading} disabled={actionLoading} className="btn btn-primary" style={{ background: '#0f3460' }}>
                  {actionLoading ? 'Saving...' : 'Save Reading to Ledger'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Configure Limits Modal (Admin Only) */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                Configure Setpoints: {selectedContainerId}
              </h3>
              <button onClick={() => setShowConfigModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Target Setpoint Temperature (°C):
                </label>
                <input
                  type="number"
                  step="0.5"
                  className="input-control"
                  value={configForm.targetTemperature}
                  onChange={(e) => setConfigForm({ ...configForm, targetTemperature: Number(e.target.value) })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Min Temp Threshold (°C):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    className="input-control"
                    value={configForm.minTemperature}
                    onChange={(e) => setConfigForm({ ...configForm, minTemperature: Number(e.target.value) })}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                    Max Temp Threshold (°C):
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    className="input-control"
                    value={configForm.maxTemperature}
                    onChange={(e) => setConfigForm({ ...configForm, maxTemperature: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Telemetry Sensor ID:
                </label>
                <input
                  type="text"
                  className="input-control"
                  value={configForm.sensorId}
                  onChange={(e) => setConfigForm({ ...configForm, sensorId: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setShowConfigModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleSaveConfig} disabled={actionLoading} className="btn btn-primary" style={{ background: '#0f3460' }}>
                  {actionLoading ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Quarantine Hold Modal */}
      {showHoldModal && (
        <div className="modal-overlay" onClick={() => setShowHoldModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#dc2626' }}>
                Place on Cold-Chain Quarantine Hold
              </h3>
              <button onClick={() => setShowHoldModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Quarantine Justification & Hold Reason:
                </label>
                <textarea
                  className="input-control"
                  rows="3"
                  value={holdForm.holdReason}
                  onChange={(e) => setHoldForm({ ...holdForm, holdReason: e.target.value })}
                />
              </div>

              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Placing container on hold locks vessel dispatch and notifies port operations.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setShowHoldModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handlePlaceHold} disabled={actionLoading} className="btn btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }}>
                  {actionLoading ? 'Holding...' : 'Confirm Quarantine Hold'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Reefer Physical Checklist Modal */}
      {showChecklistModal && (
        <div className="modal-overlay" onClick={() => setShowChecklistModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                6-Point Reefer Physical Inspection: {selectedContainerId}
              </h3>
              <button onClick={() => setShowChecklistModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {checklistForm.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: '#0f172a' }}>{item.item}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {['Pass', 'Fail', 'N/A'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => {
                          const updated = [...checklistForm.items];
                          updated[idx].status = opt;
                          setChecklistForm({ ...checklistForm, items: updated });
                        }}
                        className={`btn btn-sm ${item.status === opt ? (opt === 'Pass' ? 'btn-primary' : opt === 'Fail' ? 'btn-outline' : 'btn-secondary') : 'btn-secondary'}`}
                        style={item.status === opt && opt === 'Pass' ? { background: '#16a34a', borderColor: '#16a34a' } : item.status === opt && opt === 'Fail' ? { color: '#dc2626', borderColor: '#dc2626' } : {}}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Overall Result:</span>
                  <select
                    className="select-control"
                    style={{ padding: '4px 10px', fontSize: '12px' }}
                    value={checklistForm.result}
                    onChange={(e) => setChecklistForm({ ...checklistForm, result: e.target.value })}
                  >
                    <option value="Pass">Pass (Compliant)</option>
                    <option value="Fail">Fail (Quarantine Required)</option>
                    <option value="Requires Maintenance">Requires Maintenance</option>
                  </select>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowChecklistModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <button onClick={handleSubmitChecklist} disabled={actionLoading} className="btn btn-primary" style={{ background: '#0f3460' }}>
                    {actionLoading ? 'Submitting...' : 'Submit Inspection'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Resolve Incident Modal */}
      {showResolveModal && selectedIncident && (
        <div className="modal-overlay" onClick={() => setShowResolveModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                Record Action: {selectedIncident.incidentId}
              </h3>
              <button onClick={() => setShowResolveModal(false)} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                  Corrective Action Executed:
                </label>
                <textarea
                  className="input-control"
                  rows="3"
                  value={resolveForm.correctiveAction}
                  onChange={(e) => setResolveForm({ ...resolveForm, correctiveAction: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="reinspCheck"
                  checked={resolveForm.reinspectionRequired}
                  onChange={(e) => setResolveForm({ ...resolveForm, reinspectionRequired: e.target.checked })}
                />
                <label htmlFor="reinspCheck" style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                  Require Physical Re-Inspection by Officer
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setShowResolveModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleResolveIncident} disabled={actionLoading} className="btn btn-primary" style={{ background: '#0f3460' }}>
                  {actionLoading ? 'Saving...' : 'Save Resolution'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemperatureMonitoringPage;
