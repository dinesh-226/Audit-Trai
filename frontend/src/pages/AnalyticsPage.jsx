import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { SummaryCard } from '../components/analytics/SummaryCard';
import { ChartCard } from '../components/analytics/ChartCard';
import { DrillDownModal } from '../components/analytics/DrillDownModal';
import {
  BarChart3,
  TrendingUp,
  Download,
  Printer,
  RotateCcw,
  Calendar,
  Filter,
  Search,
  Ship,
  Box,
  FileCheck,
  ShieldCheck,
  Lock,
  Layers,
  Sparkles,
  Info,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Anchor,
  Navigation,
  Clock,
  CheckCircle2,
  XCircle,
  Shield,
  Thermometer
} from 'lucide-react';
import { TemperatureMonitoringPage } from './TemperatureMonitoringPage';

export const AnalyticsPage = ({ onNavigate, initialTab }) => {
  const { user, hasRole } = useAuth();

  // Active Workspace Tab
  const [activeTab, setActiveTab] = useState(initialTab || 'overview'); // 'overview', 'port', 'ships', 'inspections', 'audit', 'temperature'

  // Global Filter State
  const [dateRange, setDateRange] = useState('30d');
  const [selectedPort, setSelectedPort] = useState('ALL');
  const [selectedShip, setSelectedShip] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [summaryData, setSummaryData] = useState(null);
  const [adminCharts, setAdminCharts] = useState(null);
  const [portCharts, setPortCharts] = useState(null);
  const [shipCharts, setShipCharts] = useState(null);
  const [inspectorCharts, setInspectorCharts] = useState(null);
  const [availablePorts, setAvailablePorts] = useState([]);
  const [availableShips, setAvailableShips] = useState([]);
  const [analyticsError, setAnalyticsError] = useState('');
  const [loading, setLoading] = useState(true);

  // Drilldown Modal State
  const [drilldownConfig, setDrilldownConfig] = useState({
    isOpen: false,
    title: '',
    type: 'containers',
    filterKey: '',
    filterValue: ''
  });

  // Export Notification
  const [exportNotice, setExportNotice] = useState(null);

  useEffect(() => {
    loadAnalytics();
  }, [dateRange, selectedPort, selectedShip]);

  const loadAnalytics = async () => {
    setLoading(true);
    setAnalyticsError('');
    setSummaryData(null);
    setPortCharts(null);
    setShipCharts(null);
    setInspectorCharts(null);
    setAdminCharts(null);
    const filterParams = { dateRange, port: selectedPort, shipId: selectedShip };
    const sections = [
      ['summary', () => api.analytics.getSummary(filterParams)],
      ['port', () => api.analytics.getPortManager(filterParams)],
      ['ships', () => api.analytics.getShipManager(filterParams)],
      ['inspections', () => api.analytics.getInspector(filterParams)]
    ];
    if (user?.role === 'admin') {
      sections.push(['admin', () => api.analytics.getAdmin(filterParams)]);
    }

    const results = await Promise.allSettled(sections.map(([, request]) => request()));
    const responses = {};
    const failedSections = [];

    results.forEach((result, index) => {
      const [name] = sections[index];
      if (result.status === 'fulfilled') {
        responses[name] = result.value;
      } else {
        responses[name] = null;
        failedSections.push(name);
      }
    });

    setSummaryData(responses.summary?.summary || null);
    setPortCharts(responses.port?.charts || null);
    setShipCharts(responses.ships?.charts || null);
    setInspectorCharts(responses.inspections?.charts || null);
    setAdminCharts(responses.admin?.charts || null);
    setAvailablePorts(responses.summary?.filters?.ports || []);
    setAvailableShips(responses.summary?.filters?.ships || []);
    setAnalyticsError(failedSections.length ? `Unable to load: ${failedSections.join(', ')} analytics.` : '');
    setLoading(false);
  };

  // Trigger Drill-down from Chart Clicks
  const handleChartElementClick = (e) => {
    const { label, drilldownType, value } = e;
    let type = 'containers';
    let filterKey = 'status';
    let filterValue = label;

    if (drilldownType === 'inspections') {
      type = 'inspections';
      filterKey = 'result';
    } else if (drilldownType === 'ships') {
      type = 'ships';
      filterKey = 'status';
    } else if (drilldownType === 'audit') {
      type = 'audit-logs';
      filterKey = 'action';
    }

    setDrilldownConfig({
      isOpen: true,
      title: `Drill-Down: ${label} (${value || ''} records)`,
      type,
      filterKey,
      filterValue
    });
  };

  // Export Dashboard Data
  const handleExportDashboardCsv = async () => {
    try {
      await api.analytics.logExport({
        exportType: 'Full Analytics Dataset',
        format: 'CSV',
        filterParams: { dateRange, port: selectedPort, ship: selectedShip }
      });
      window.location.href = api.reports.getCsvExportUrl();
      setExportNotice('Analytics dataset exported successfully. Audit event recorded.');
      setTimeout(() => setExportNotice(null), 4000);
    } catch (e) {
      alert(`Export error: ${e.message}`);
    }
  };

  return (
    <div className="page-wrapper" style={{ paddingBottom: '60px' }}>
      {/* 1. Header & Context */}
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
            <BarChart3 size={14} />
            <span>VISUAL INTELLIGENCE & PERFORMANCE ANALYTICS</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>
            Reports & Analytics
          </h1>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Interactive Port Metrics &bull; Active Role: <strong style={{ color: '#0f3460' }}>{user?.role?.toUpperCase() || 'OFFICER'}</strong>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => window.print()}
            className="btn btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <Printer size={15} />
            <span>Print View</span>
          </button>
          <button
            onClick={handleExportDashboardCsv}
            className="btn btn-secondary"
            style={{ fontWeight: 700 }}
          >
            <Download size={15} />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => onNavigate ? onNavigate('reports') : null}
            className="btn btn-primary"
            style={{ background: '#0f3460', borderColor: '#0f3460' }}
          >
            <FileText size={15} />
            <span>Download Certified PDF</span>
          </button>
        </div>
      </div>

      {/* Export Toast Notification */}
      {exportNotice && (
        <div style={{
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          borderRadius: '12px',
          padding: '12px 18px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#166534',
          fontSize: '13px',
          fontWeight: 600
        }}>
          <CheckCircle size={16} color="#16a34a" />
          <span>{exportNotice}</span>
        </div>
      )}

      {analyticsError && (
        <div role="alert" className="maritime-card" style={{ padding: '12px 16px', marginBottom: '20px', color: '#991b1b', borderColor: '#fecaca' }}>
          {analyticsError}
        </div>
      )}

      {/* 2. Global Filter Toolbar */}
      <div className="maritime-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Filters */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Date Range */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={15} color="#0284c7" />
              <select
                className="select-control"
                style={{ padding: '6px 12px', fontSize: '12px', minWidth: '130px' }}
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="today">Today</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
              </select>
            </div>

            {/* Port Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Filter size={15} color="#0f3460" />
              <select
                className="select-control"
                style={{ padding: '6px 12px', fontSize: '12px', minWidth: '150px' }}
                value={selectedPort}
                onChange={(e) => setSelectedPort(e.target.value)}
              >
                <option value="ALL">All Ports & Bays</option>
                {availablePorts.map(port => <option key={port} value={port}>{port}</option>)}
              </select>
            </div>

            {/* Ship Filter */}
            <select
              className="select-control"
              style={{ padding: '6px 12px', fontSize: '12px', minWidth: '140px' }}
              value={selectedShip}
              onChange={(e) => setSelectedShip(e.target.value)}
            >
              <option value="ALL">All Vessels</option>
              {availableShips.map(ship => <option key={ship.shipId} value={ship.shipId}>{ship.name}</option>)}
            </select>
          </div>

          {/* Search & Refresh */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8fafc', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
              <Search size={14} color="#64748b" />
              <input
                type="text"
                placeholder="Search chart data..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: '12px', width: '150px' }}
              />
            </div>

            <button onClick={loadAnalytics} className="btn btn-outline btn-sm">
              <RotateCcw size={13} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Fifteen Summary Cards Grid */}
      {summaryData ? <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '26px'
      }}>
        <SummaryCard {...summaryData.totalContainers} onClick={() => onNavigate && onNavigate('containers')} />
        <SummaryCard {...summaryData.containersInPort} onClick={() => onNavigate && onNavigate('containers')} />
        <SummaryCard {...summaryData.containersLoaded} onClick={() => onNavigate && onNavigate('containers')} />
        <SummaryCard {...summaryData.containersUnloaded} onClick={() => onNavigate && onNavigate('containers')} />
        <SummaryCard {...summaryData.containersOnHold} onClick={() => onNavigate && onNavigate('containers')} />

        <SummaryCard {...summaryData.totalShips} onClick={() => onNavigate && onNavigate('ships')} />
        <SummaryCard {...summaryData.shipsInPort} onClick={() => onNavigate && onNavigate('ships')} />
        <SummaryCard {...summaryData.activeVoyages} onClick={() => onNavigate && onNavigate('voyages')} />
        <SummaryCard {...summaryData.delayedVoyages} onClick={() => onNavigate && onNavigate('voyages')} />

        <SummaryCard {...summaryData.pendingInspections} onClick={() => onNavigate && onNavigate('inspections')} />
        <SummaryCard {...summaryData.passedInspections} onClick={() => onNavigate && onNavigate('inspections')} />
        <SummaryCard {...summaryData.failedInspections} onClick={() => onNavigate && onNavigate('inspections')} />

        <SummaryCard {...summaryData.totalAuditEvents} onClick={() => onNavigate && onNavigate('audit')} />
        <SummaryCard {...summaryData.failedLogins} onClick={() => onNavigate && onNavigate('audit')} />
        <SummaryCard {...summaryData.auditIntegrity} onClick={() => onNavigate && onNavigate('audit')} />
      </div> : (
        <div className="maritime-card" style={{ padding: '20px', marginBottom: '26px', color: '#64748b' }}>
          {loading ? 'Loading live summary...' : 'No summary data is available.'}
        </div>
      )}

      {/* 4. Interactive Domain Workspace Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('overview')}
          className={`btn btn-sm ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
          style={activeTab === 'overview' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
        >
          <BarChart3 size={14} />
          <span>Executive Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('port')}
          className={`btn btn-sm ${activeTab === 'port' ? 'btn-primary' : 'btn-secondary'}`}
          style={activeTab === 'port' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
        >
          <Layers size={14} />
          <span>Port Operations (8)</span>
        </button>

        <button
          onClick={() => setActiveTab('ships')}
          className={`btn btn-sm ${activeTab === 'ships' ? 'btn-primary' : 'btn-secondary'}`}
          style={activeTab === 'ships' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
        >
          <Ship size={14} />
          <span>Ships & Voyages (7)</span>
        </button>

        <button
          onClick={() => setActiveTab('inspections')}
          className={`btn btn-sm ${activeTab === 'inspections' ? 'btn-primary' : 'btn-secondary'}`}
          style={activeTab === 'inspections' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
        >
          <FileCheck size={14} />
          <span>Safety & Inspections (7)</span>
        </button>

        {user?.role === 'admin' && (
          <button
            onClick={() => setActiveTab('audit')}
            className={`btn btn-sm ${activeTab === 'audit' ? 'btn-primary' : 'btn-secondary'}`}
            style={activeTab === 'audit' ? { background: '#0f3460', borderColor: '#0f3460' } : {}}
          >
            <ShieldCheck size={14} />
            <span>Admin & Audit Trail (8)</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('temperature')}
          className={`btn btn-sm ${activeTab === 'temperature' ? 'btn-primary' : 'btn-secondary'}`}
          style={activeTab === 'temperature' ? { background: '#0284c7', borderColor: '#0284c7', color: '#ffffff' } : {}}
        >
          <Thermometer size={14} />
          <span>❄️ Reefer Temperature & Cold-Chain</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 5. TAB 1: EXECUTIVE OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          <ChartCard
            title="Container Movement Status"
            subtitle="Breakdown across Gate In, Yard Stacking, Loading, and Transit"
            type="doughnut"
            data={portCharts?.containerMovementStatus}
            onElementClick={handleChartElementClick}
            drilldownType="containers"
          />

          <ChartCard
            title="Vessel Status Distribution"
            subtitle="Active fleet sailing at sea vs berthed in port"
            type="doughnut"
            data={shipCharts?.shipStatusDistribution}
            onElementClick={handleChartElementClick}
            drilldownType="ships"
          />

          <ChartCard
            title="7-Point Safety Inspection Results"
            subtitle="Containers meeting ISO 17712 standards vs flagged for hold"
            type="doughnut"
            data={inspectorCharts?.inspectionResultDistribution}
            onElementClick={handleChartElementClick}
            drilldownType="inspections"
          />

          <ChartCard
            title="Audit Events by Action Type"
            subtitle="High-frequency operational events recorded in immutable ledger"
            type="bar"
            data={adminCharts?.auditEventsByAction}
            onElementClick={handleChartElementClick}
            drilldownType="audit"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB 2: PORT OPERATIONS (8 CHARTS) */}
      {/* ========================================================================= */}
      {activeTab === 'port' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          <ChartCard
            title="1. Container Movement Status"
            subtitle="Containers in gate entry, yard, loading, unloading, loaded, and on hold"
            type="doughnut"
            data={portCharts?.containerMovementStatus}
            onElementClick={handleChartElementClick}
            drilldownType="containers"
          />

          <ChartCard
            title="2. Daily Gate Entry and Exit"
            subtitle="Comparison of gate-in vs gate-out truck deliveries"
            type="bar"
            data={portCharts?.dailyGateEntryExit}
            unit="TEU"
          />

          <ChartCard
            title="3. Loading and Unloading Trends"
            subtitle="Quay crane operations throughput over time"
            type="line"
            data={portCharts?.loadingUnloadingTrends}
            unit="events"
          />

          <ChartCard
            title="4. Yard Occupancy by Zone"
            subtitle="Occupied capacity across dry, reefer, and hazardous blocks"
            type="bar"
            data={portCharts?.yardOccupancy}
            unit="containers"
          />

          <ChartCard
            title="5. Berth Occupancy & Ship Allocation"
            subtitle="Quay berth utilization and ship assignment"
            type="horizontalBar"
            data={portCharts?.berthOccupancy}
            unit="allocations"
          />

          <ChartCard
            title="6. Port Activity by Operation Type"
            subtitle="Gate entries, yard transfers, crane loading, and holds"
            type="bar"
            data={portCharts?.portActivityByType}
            unit="Ops"
          />

          <ChartCard
            title="7. Operational Delays by Reason"
            subtitle="Customs holds, monsoons, and berth congestion"
            type="bar"
            data={portCharts?.operationalDelays}
            unit="Events"
          />

          <ChartCard
            title="8. Container Processing & Dwell Time"
            subtitle="Average turnaround duration between milestone steps"
            type="bar"
            data={portCharts?.containerProcessingTime}
            unit="Hours"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. TAB 3: SHIPS & VOYAGES (7 CHARTS) */}
      {/* ========================================================================= */}
      {activeTab === 'ships' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          <ChartCard
            title="1. Ship Status Distribution"
            subtitle="Ships sailing, at port, berthed, delayed, or in dry-dock"
            type="doughnut"
            data={shipCharts?.shipStatusDistribution}
            onElementClick={handleChartElementClick}
            drilldownType="ships"
          />

          <ChartCard
            title="2. Active Voyage Progress"
            subtitle="Sailing progress and completion status for live sea routes"
            type="bar"
            data={shipCharts?.activeVoyagesChart}
            unit="%"
          />

          <ChartCard
            title="3. Estimated vs Actual Arrival"
            subtitle="Comparing planned ETA against actual arrival durations"
            type="bar"
            data={shipCharts?.arrivalComparison}
            unit="Days"
          />

          <ChartCard
            title="4. Voyage Delays by Route"
            subtitle="Sea voyage delay hours recorded per shipping lane"
            type="bar"
            data={shipCharts?.voyageDelays}
            unit="Hours"
          />

          <ChartCard
            title="5. Active Vessel Speed Trend"
            subtitle="Cruising speed monitoring over voyage coordinates"
            type="line"
            data={shipCharts?.shipSpeedTrend}
            unit="Knots"
          />

          <ChartCard
            title="6. Containers by Ship Allocation"
            subtitle="Assigned vs loaded vs pending container inventory per vessel"
            type="bar"
            data={shipCharts?.containersByShip}
            unit="containers"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. TAB 4: SAFETY & INSPECTIONS (7 CHARTS) */}
      {/* ========================================================================= */}
      {activeTab === 'inspections' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          <ChartCard
            title="1. Inspection Result Distribution"
            subtitle="Passed, Failed, Quarantine Holds, and Repair Required"
            type="doughnut"
            data={inspectorCharts?.inspectionResultDistribution}
            onElementClick={handleChartElementClick}
            drilldownType="inspections"
          />

          <ChartCard
            title="2. Inspections Completed Over Time"
            subtitle="Daily volume of 7-point physical inspections"
            type="line"
            data={inspectorCharts?.inspectionsOverTime}
            unit="Units"
          />

          <ChartCard
            title="3. Pass & Fail Trends Comparison"
            subtitle="Weekly compliance rate of container inspections"
            type="stackedBar"
            data={inspectorCharts?.passFailTrends}
            unit="Units"
          />

          <ChartCard
            title="4. Common Inspection Failures"
            subtitle="Damaged seals, structural cracks, IMDG labels, and reefer issues"
            type="horizontalBar"
            data={inspectorCharts?.commonInspectionFailures}
            unit="Cases"
          />

          <ChartCard
            title="5. Inspector Workload Allocation"
            subtitle="Completed vs pending inspection queues per officer"
            type="bar"
            data={inspectorCharts?.inspectorWorkload}
            unit="Tasks"
          />

          <ChartCard
            title="6. Inspection Completion Time"
            subtitle="Average turnaround duration by inspection category"
            type="bar"
            data={inspectorCharts?.inspectionCompletionTime}
            unit="hours"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. TAB 5: ADMIN & AUDIT TRAIL (8 CHARTS) */}
      {/* ========================================================================= */}
      {activeTab === 'audit' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '20px' }}>
          <ChartCard
            title="1. User Distribution by Role"
            subtitle="Admin, Port Manager, Ship Manager, Inspector, and Viewer accounts"
            type="doughnut"
            data={adminCharts?.userDistribution}
          />

          <ChartCard
            title="2. User Activity Over Time"
            subtitle="System logins, record creations, updates, and exports"
            type="line"
            data={adminCharts?.userActivityOverTime}
            unit="Actions"
          />

          <ChartCard
            title="3. Audit Events by Action Type"
            subtitle="Event frequency breakdown in cryptographic ledger"
            type="bar"
            data={adminCharts?.auditEventsByAction}
            unit="Logs"
            onElementClick={handleChartElementClick}
            drilldownType="audit"
          />

          <ChartCard
            title="4. Audit Events by User Role"
            subtitle="Operational contribution by officer role"
            type="bar"
            data={adminCharts?.auditEventsByRole}
            unit="Logs"
          />

          <ChartCard
            title="5. Audit Integrity Status"
            subtitle="Cryptographically verified blocks vs flagged anomalies"
            type="doughnut"
            data={adminCharts?.auditIntegrityStatus}
          />

          <ChartCard
            title="6. Failed Logins & Security Events"
            subtitle="Security monitoring, password resets, and critical alerts"
            type="bar"
            data={adminCharts?.securityEventsOverTime}
            unit="Events"
          />

          <ChartCard
            title="7. Record Changes Over Time"
            subtitle="Total containers, ships, voyages, and inspections tracked"
            type="bar"
            data={adminCharts?.recordChangesOverTime}
            unit="Entities"
          />

          <ChartCard
            title="8. Top Active Users"
            subtitle="Officers with highest number of verified actions"
            type="horizontalBar"
            data={adminCharts?.topActiveUsers}
            unit="Actions"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TAB: INTEGRATED COLD-CHAIN & REEFER TEMPERATURE MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'temperature' && (
        <div style={{ marginTop: '10px' }}>
          <TemperatureMonitoringPage onNavigate={onNavigate} />
        </div>
      )}

      {/* Drill-down Modal */}
      <DrillDownModal
        isOpen={drilldownConfig.isOpen}
        onClose={() => setDrilldownConfig({ ...drilldownConfig, isOpen: false })}
        title={drilldownConfig.title}
        type={drilldownConfig.type}
        filterKey={drilldownConfig.filterKey}
        filterValue={drilldownConfig.filterValue}
      />
    </div>
  );
};

export default AnalyticsPage;
