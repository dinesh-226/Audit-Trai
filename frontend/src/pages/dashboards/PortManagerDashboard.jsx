import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Anchor,
  Box,
  Ship,
  Clock,
  ArrowUpRight,
  TrendingUp,
  MapPin,
  CheckCircle,
  AlertTriangle,
  ShieldCheck,
  Plus,
  Radio,
  Layers,
  Sparkles,
  Truck,
  FileText,
  AlertCircle,
  CheckCircle2,
  X,
  Search,
  Filter,
  ArrowRight,
  Send,
  Printer,
  Calendar,
  Grid,
  ClipboardList
} from 'lucide-react';

export const PortManagerDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [assignedPort, setAssignedPort] = useState(user?.assignedPort || 'Mumbai Port');

  const [activeTab, setActiveTab] = useState('berths'); // 'berths', 'yard', 'gate', 'loading', 'inspections', 'activities'
  const [containers, setContainers] = useState([]);
  const [ships, setShips] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [berthsData, setBerthsData] = useState(null);
  const [portActivities, setPortActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [yardBlockFilter, setYardBlockFilter] = useState('ALL');

  // Active Modals
  const [gateModalOpen, setGateModalOpen] = useState(false);
  const [yardModalContainer, setYardModalContainer] = useState(null);
  const [berthModalBerth, setBerthModalBerth] = useState(null);
  const [loadingModalContainer, setLoadingModalContainer] = useState(null);
  const [holdModalContainer, setHoldModalContainer] = useState(null);
  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [portLogModalOpen, setPortLogModalOpen] = useState(false);
  const [raiseIssueModalOpen, setRaiseIssueModalOpen] = useState(false);
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportData, setReportData] = useState(null);

  // Form States
  const [gateForm, setGateForm] = useState({
    containerId: '',
    gateType: 'GATE_IN',
    gateNumber: 'Gate 01 (North Entry)',
    truckNumber: 'MH-04-TR-9218',
    driverName: 'Rajesh Kumar',
    sealNumber: '',
    notes: ''
  });

  const [yardForm, setYardForm] = useState({
    yardBlock: 'A',
    yardBay: '04',
    yardRow: '02',
    yardTier: '3',
    notes: ''
  });

  const [berthForm, setBerthForm] = useState({
    vessel: '',
    imo: '',
    shipId: '',
    status: 'Docked & Unloading',
    cranesActive: 3,
    teuThroughput: '1,200 TEU',
    notes: ''
  });

  const [loadingForm, setLoadingForm] = useState({
    actionType: 'LOAD',
    shipId: '',
    craneNumber: 'Crane 02',
    notes: ''
  });

  const [holdForm, setHoldForm] = useState({
    reason: 'Security seal discrepancy detected at gate',
    notes: ''
  });

  const [delayForm, setDelayForm] = useState({
    entityType: 'Ship',
    entityId: '',
    delayReason: 'Monsoon weather & swell restriction',
    estimatedDelayHours: 6,
    notes: ''
  });

  const [portLogForm, setPortLogForm] = useState({
    activityType: 'GENERAL_OPERATION',
    entityType: 'Berth',
    entityId: 'Berth 01',
    title: 'Routine quay crane safety inspection completed',
    notes: ''
  });

  const [issueForm, setIssueForm] = useState({
    targetRole: 'Inspector',
    title: 'Urgent: Physical seal mismatch on container',
    message: 'Container seal number SL-9921 differs from electronic manifest. Requires physical verification before yard staging.',
    severity: 'high',
    entityId: ''
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadAllPortData();
  }, [assignedPort]);

  const showNotice = (msg, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadAllPortData = async () => {
    setLoading(true);
    try {
      const [allContainers, allShips, allInspections, berthsRes, activitiesRes] = await Promise.all([
        api.containers.getAll(),
        api.ships.getAll(),
        api.inspections.getAll(),
        api.portActivities.getBerths(assignedPort),
        api.portActivities.getAll({ port: assignedPort, limit: 30 })
      ]);
      setContainers(allContainers || []);
      setShips(allShips || []);
      setInspections(allInspections || []);
      setBerthsData(berthsRes || null);
      setPortActivities(activitiesRes || []);
    } catch (e) {
      console.error('Failed to load port data:', e);
    } finally {
      setLoading(false);
    }
  };

  // Filtered port containers
  const portContainers = containers.filter(c =>
    !searchQuery ||
    c.containerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.cargoDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.currentLocation?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sealNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const yardContainers = portContainers.filter(c =>
    (c.status === 'Booked' || c.status === 'Ready for Loading' || c.currentLocation?.toLowerCase().includes('yard')) &&
    (yardBlockFilter === 'ALL' || c.currentLocation?.includes(`Block ${yardBlockFilter}`))
  );

  const loadingQueueContainers = portContainers.filter(c =>
    c.status === 'Ready for Loading' || c.status === 'Booked' || c.status === 'Loaded' || c.status === 'Unloading'
  );

  const waitingForInspectionContainers = portContainers.filter(c =>
    c.status === 'Under Inspection' || c.status === 'Ready for Loading'
  );

  const failedInspectionsList = inspections.filter(i =>
    i.result === 'Failed' || i.result === 'Flagged for Quarantine' || i.result === 'Requires Re-inspection'
  );

  // --- Handlers ---

  const handleRecordGate = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.portActivities.recordGate({
        ...gateForm,
        port: assignedPort
      });
      showNotice(res.message || 'Gate event recorded successfully');
      setGateModalOpen(false);
      setGateForm({
        containerId: '',
        gateType: 'GATE_IN',
        gateNumber: 'Gate 01 (North Entry)',
        truckNumber: 'MH-04-TR-9218',
        driverName: 'Rajesh Kumar',
        sealNumber: '',
        notes: ''
      });
      await loadAllPortData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignYardSlot = async (e) => {
    e.preventDefault();
    if (!yardModalContainer) return;
    setActionLoading(true);
    try {
      const res = await api.portActivities.assignYardSlot({
        containerId: yardModalContainer.containerId,
        ...yardForm,
        port: assignedPort
      });
      showNotice(res.message || 'Yard slot assigned');
      setYardModalContainer(null);
      await loadAllPortData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateBerth = async (e) => {
    e.preventDefault();
    if (!berthModalBerth) {
      showNotice('Please select a target berth', true);
      return;
    }
    setActionLoading(true);
    try {
      const res = await api.portActivities.updateBerth(berthModalBerth.berthId, {
        ...berthForm,
        port: assignedPort
      });
      showNotice(res.message || 'Berth updated successfully');
      setBerthModalBerth(null);
      await loadAllPortData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExecuteLoadingAction = async (e) => {
    e.preventDefault();
    if (!loadingModalContainer) return;
    setActionLoading(true);
    try {
      const res = await api.portActivities.loadingAction({
        containerId: loadingModalContainer.containerId,
        ...loadingForm,
        port: assignedPort
      });
      showNotice(res.message || 'Loading operation completed');
      setLoadingModalContainer(null);
      await loadAllPortData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleHoldContainer = async (e) => {
    e.preventDefault();
    if (!holdModalContainer) return;
    setActionLoading(true);
    try {
      const res = await api.portActivities.holdContainer({
        containerId: holdModalContainer.containerId,
        reason: holdForm.reason,
        notes: holdForm.notes,
        port: assignedPort
      });
      showNotice(res.message || 'Container placed on hold');
      setHoldModalContainer(null);
      await loadAllPortData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordDelay = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.portActivities.recordDelay({
        ...delayForm,
        port: assignedPort
      });
      showNotice(res.message || 'Operational delay recorded');
      setDelayModalOpen(false);
      await loadAllPortData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogPortActivity = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await api.portActivities.logActivity({
        ...portLogForm,
        port: assignedPort
      });
      showNotice(res.message || 'Port activity added to audit trail');
      setPortLogModalOpen(false);
      await loadAllPortData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRaiseIssue = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.alerts.create({
        title: issueForm.title,
        message: issueForm.message,
        severity: issueForm.severity,
        category: 'inspection_failed',
        entityType: 'Container',
        entityId: issueForm.entityId || 'PORT-OPS',
        metadata: {
          port: assignedPort,
          targetRole: issueForm.targetRole,
          raisedBy: user?.name
        }
      });
      showNotice(`Issue ticket submitted directly to ${issueForm.targetRole}`);
      setRaiseIssueModalOpen(false);
      setIssueForm({
        targetRole: 'Inspector',
        title: 'Urgent: Physical seal mismatch on container',
        message: 'Container seal number SL-9921 differs from electronic manifest. Requires physical verification before yard staging.',
        severity: 'high',
        entityId: ''
      });
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenReportModal = async () => {
    try {
      const rep = await api.portActivities.getReport(assignedPort);
      setReportData(rep);
      setReportModalOpen(true);
    } catch (err) {
      showNotice('Failed to generate report', true);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Toast Notification */}
      {notification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: notification.isError ? '#ef4444' : '#0f3460',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 600
        }}>
          {notification.isError ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* Port Operations Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '1px' }}>
              PORT MANAGEMENT & LOGISTICS
            </span>
            <span className="badge badge-cyan" style={{ fontSize: '10px' }}>PORT MANAGER</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>
              {assignedPort} Control Center
            </h1>
            <select
              className="select-control"
              value={assignedPort}
              onChange={(e) => setAssignedPort(e.target.value)}
              style={{ width: 'auto', fontSize: '12px', padding: '4px 10px', fontWeight: 700 }}
            >
              <option value="Mumbai Port">Port: Mumbai Port (IN)</option>
              <option value="Singapore Port">Port: Singapore Port (SG)</option>
              <option value="Port of Rotterdam">Port: Rotterdam (NL)</option>
              <option value="Shanghai Port">Port: Shanghai (CN)</option>
            </select>
          </div>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Port Manager: <strong style={{ color: '#0f172a' }}>{user?.name}</strong> &bull; Terminal: <strong>Quay Terminal & Yard Operations</strong>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={() => setGateModalOpen(true)} className="btn btn-primary btn-sm">
            <Truck size={14} />
            <span>Gate In / Out</span>
          </button>
          <button onClick={() => setDelayModalOpen(true)} className="btn btn-secondary btn-sm" style={{ borderColor: '#fde68a', color: '#b45309' }}>
            <AlertCircle size={14} color="#b45309" />
            <span>Report Delay</span>
          </button>
          <button onClick={() => setPortLogModalOpen(true)} className="btn btn-secondary btn-sm">
            <ClipboardList size={14} color="#0f3460" />
            <span>Log Activity</span>
          </button>
          <button onClick={() => setRaiseIssueModalOpen(true)} className="btn btn-secondary btn-sm" style={{ color: '#0284c7' }}>
            <Send size={14} color="#0284c7" />
            <span>Raise Issue</span>
          </button>
          <button onClick={handleOpenReportModal} className="btn btn-secondary btn-sm">
            <FileText size={14} />
            <span>Port Report</span>
          </button>
        </div>
      </div>

      {/* 6 Key Operational KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Total Yard Units */}
        <div className="maritime-card" style={{ padding: '16px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Port Containers</span>
            <Box size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {portContainers.length} Units
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px', fontWeight: 600 }}>
            {yardContainers.length} Stored in Yard
          </div>
        </div>

        {/* Berth Capacity */}
        <div className="maritime-card" style={{ padding: '16px', borderLeft: '4px solid #0f3460' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Berths & Ships</span>
            <Anchor size={16} color="#0f3460" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {berthsData?.capacityPercent || 75}% Occupied
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            {berthsData?.occupiedBerths || 3} of {berthsData?.totalBerths || 4} Docks Active
          </div>
        </div>

        {/* Ships Waiting */}
        <div className="maritime-card" style={{ padding: '16px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Anchorage Queue</span>
            <Ship size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {berthsData?.waitingShips?.length || 1} Waiting
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            Awaiting Berth Assignment
          </div>
        </div>

        {/* Gate Activity */}
        <div className="maritime-card" style={{ padding: '16px', borderLeft: '4px solid #0f3460' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Gate Movement</span>
            <Truck size={16} color="#0f3460" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {portActivities.filter(a => a.activityType === 'GATE_IN' || a.activityType === 'GATE_OUT').length || 12} Gates
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px', fontWeight: 600 }}>
            Gate-In & Out Recorded
          </div>
        </div>

        {/* Inspection Queue */}
        <div className="maritime-card" style={{ padding: '16px', borderLeft: `4px solid ${failedInspectionsList.length > 0 ? '#ef4444' : '#10b981'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Inspections</span>
            <ShieldCheck size={16} color={failedInspectionsList.length > 0 ? '#ef4444' : '#10b981'} />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: failedInspectionsList.length > 0 ? '#dc2626' : '#0f172a' }}>
            {failedInspectionsList.length > 0 ? `${failedInspectionsList.length} Failed` : '100% Cleared'}
          </div>
          <div style={{ fontSize: '11px', color: failedInspectionsList.length > 0 ? '#dc2626' : '#10b981', marginTop: '2px', fontWeight: 600 }}>
            {failedInspectionsList.length > 0 ? 'Requires Quarantine Hold' : 'All Inspected Passed'}
          </div>
        </div>

        {/* Operational Delays */}
        <div className="maritime-card" style={{ padding: '16px', borderLeft: '4px solid #b45309' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Delays / Holds</span>
            <AlertTriangle size={16} color="#b45309" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {portContainers.filter(c => c.isDelayed || c.status === 'Flagged').length} Holds
          </div>
          <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px', fontWeight: 600 }}>
            Active Exceptions
          </div>
        </div>
      </div>

      {/* Navigation Tabs for 6 Workspaces */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '22px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'berths', label: '1. Berths & Vessel Traffic', icon: Anchor },
          { id: 'yard', label: '2. Yard Stacking & Slots', icon: Grid },
          { id: 'gate', label: '3. Gate-In & Gate-Out Logs', icon: Truck },
          { id: 'loading', label: '4. Loading & Unloading Queue', icon: Ship },
          { id: 'inspections', label: '5. Inspection Coordination & Holds', icon: ShieldCheck },
          { id: 'activities', label: '6. Port Activity History', icon: ClipboardList }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                background: 'none',
                borderBottom: isActive ? '3px solid #0284c7' : '3px solid transparent',
                color: isActive ? '#0284c7' : '#64748b',
                fontWeight: isActive ? 800 : 600,
                fontSize: '13px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} color={isActive ? '#0284c7' : '#64748b'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================
          TAB 1: BERTHS & VESSEL TRAFFIC WORKSPACE
         ========================================================= */}
      {activeTab === 'berths' && (
        <div>
          {/* Berth Allocation Grid */}
          <div className="maritime-card" style={{ padding: '22px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Live Berth & Dock Allocations at {assignedPort}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Manage vessel docking, crane schedules, and cargo throughput
                </div>
              </div>
              <button
                onClick={() => {
                  setBerthForm({
                    vessel: 'New Vessel',
                    imo: 'IMO 9800000',
                    shipId: '',
                    status: 'Docked & Unloading',
                    cranesActive: 2,
                    teuThroughput: '1,000 TEU',
                    notes: ''
                  });
                  setBerthModalBerth(berthsData?.berths?.[0] || { berthId: 'Berth 01 (Quay North)' });
                }}
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} />
                <span>Assign / Update Berth</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: '16px' }}>
              {berthsData?.berths?.map((b) => {
                const isOpen = b.vessel === 'Available / Open';
                return (
                  <div
                    key={b.berthId}
                    style={{
                      padding: '16px',
                      borderRadius: '12px',
                      background: isOpen ? '#f8fafc' : '#ffffff',
                      border: `1px solid ${isOpen ? '#cbd5e1' : '#bae6fd'}`,
                      borderLeft: `4px solid ${isOpen ? '#94a3b8' : '#0284c7'}`,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <strong style={{ fontSize: '14px', color: '#0f172a' }}>{b.berthId}</strong>
                        <span className={`badge ${isOpen ? 'badge-gray' : b.status.includes('Loading') ? 'badge-cyan' : 'badge-blue'}`}>
                          {b.status}
                        </span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: isOpen ? '#64748b' : '#0284c7', marginBottom: '4px' }}>
                        {b.vessel}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        IMO: <code>{b.imo}</code>
                      </div>
                      <div style={{ fontSize: '12px', color: '#334155', marginTop: '8px' }}>
                        Active Cranes: <strong>{b.cranesActive} Quay Cranes</strong> &bull; Volume: <strong>{b.teuThroughput}</strong>
                      </div>
                    </div>

                    <div style={{ paddingTop: '10px', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setBerthModalBerth(b);
                          setBerthForm({
                            vessel: b.vessel,
                            imo: b.imo,
                            shipId: b.shipId || '',
                            status: b.status,
                            cranesActive: b.cranesActive,
                            teuThroughput: b.teuThroughput,
                            notes: ''
                          });
                        }}
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1, justifyContent: 'center' }}
                      >
                        <span>Change Berth Status</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Ships Waiting for a Berth (Anchorage Queue) */}
          <div className="maritime-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Ships Waiting at Anchorage / Approaching {assignedPort}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Vessels awaiting berth clearance and pilot boarding
                </div>
              </div>
              <button onClick={() => onNavigate('tracking')} className="btn btn-outline btn-sm">
                <span>View on Live Map</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            {berthsData?.waitingShips?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
                No ships currently waiting in anchorage queue for {assignedPort}.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="maritime-table">
                  <thead>
                    <tr>
                      <th>Vessel Name</th>
                      <th>IMO Number</th>
                      <th>Origin &bull; Destination</th>
                      <th>Status</th>
                      <th>Capacity</th>
                      <th style={{ textAlign: 'right' }}>Berthing Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {berthsData?.waitingShips?.map((s) => (
                      <tr key={s.shipId}>
                        <td>
                          <strong style={{ color: '#0284c7' }}>{s.name}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Master: {s.captain}</div>
                        </td>
                        <td><code>{s.imoNumber}</code></td>
                        <td>{s.departurePort} ➔ {s.arrivalPort}</td>
                        <td><span className="badge badge-amber">{s.status}</span></td>
                        <td>{s.capacityTEU} TEU</td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            onClick={() => {
                              const openBerth = berthsData?.berths?.find(b => b.vessel === 'Available / Open') || berthsData?.berths?.[0] || { berthId: 'Berth 01 (Quay North)', vessel: 'Available / Open' };
                              setBerthModalBerth(openBerth);
                              setBerthForm({
                                vessel: s.name,
                                imo: s.imoNumber,
                                shipId: s.shipId,
                                status: 'Docked & Unloading',
                                cranesActive: 3,
                                teuThroughput: '1,500 TEU',
                                notes: `Assigned incoming vessel ${s.name} to dock`
                              });
                            }}
                            className="btn btn-primary btn-sm"
                          >
                            <span>Allocate Berth</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 2: YARD STACKING & SLOTS WORKSPACE
         ========================================================= */}
      {activeTab === 'yard' && (
        <div>
          {/* Yard Block Selector & Filters */}
          <div className="maritime-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#64748b', marginRight: '4px' }}>Yard Block:</span>
                {['ALL', 'A', 'B', 'C', 'D'].map((blk) => (
                  <button
                    key={blk}
                    onClick={() => setYardBlockFilter(blk)}
                    className={yardBlockFilter === blk ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                    style={{ minWidth: '40px' }}
                  >
                    {blk === 'ALL' ? 'All Blocks' : `Block ${blk}`}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, maxWidth: '360px' }}>
                <Search size={16} color="#64748b" />
                <input
                  type="text"
                  placeholder="Search container ID or cargo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-control"
                  style={{ fontSize: '13px' }}
                />
              </div>
            </div>
          </div>

          {/* Staged Containers Table */}
          <div className="maritime-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Yard Stacking Inventory ({yardContainers.length} Containers Staged)
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Manage container stacking positions (Bay, Row, Tier) and yard relocations
                </div>
              </div>
              <button onClick={() => onNavigate('containers')} className="btn btn-outline btn-sm">
                <span>View Full Inventory</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="maritime-table">
                <thead>
                  <tr>
                    <th>Container ID</th>
                    <th>Cargo & Owner</th>
                    <th>Current Yard Location</th>
                    <th>Status</th>
                    <th>Security Seal</th>
                    <th>Risk</th>
                    <th style={{ textAlign: 'right' }}>Yard Action</th>
                  </tr>
                </thead>
                <tbody>
                  {yardContainers.map((c) => (
                    <tr key={c.containerId}>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '14px' }}>{c.containerId}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{c.type} &bull; {c.weightKg?.toLocaleString()} kg</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, color: '#334155' }}>{c.cargoDescription}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{c.ownerCompany}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontWeight: 700, fontSize: '13px' }}>
                          <Grid size={13} />
                          <span>{c.currentLocation}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${c.status === 'Ready for Loading' ? 'badge-green' : c.status === 'Flagged' ? 'badge-red' : 'badge-cyan'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <code style={{ fontSize: '11px', color: '#0284c7' }}>{c.sealNumber}</code>
                      </td>
                      <td>
                        <span className={`badge ${c.riskLevel === 'Low' ? 'badge-green' : 'badge-amber'}`}>{c.riskLevel}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => {
                              setYardModalContainer(c);
                              setYardForm({ yardBlock: 'A', yardBay: '05', yardRow: '02', yardTier: '3', notes: '' });
                            }}
                            className="btn btn-secondary btn-sm"
                          >
                            <span>Assign / Move Slot</span>
                          </button>
                          <button
                            onClick={() => {
                              setLoadingModalContainer(c);
                              setLoadingForm({ actionType: 'LOAD', shipId: ships[0]?.shipId || '', craneNumber: 'Crane 02', notes: '' });
                            }}
                            className="btn btn-primary btn-sm"
                            title="Load onto Ship"
                          >
                            <Ship size={13} />
                            <span>Load</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 3: GATE-IN & GATE-OUT LOGS WORKSPACE
         ========================================================= */}
      {activeTab === 'gate' && (
        <div>
          <div className="maritime-card" style={{ padding: '22px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Gate Entry & Exit Log Stream at {assignedPort}
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Verified physical gate pass records, trucker manifests, and seal checks
                </div>
              </div>
              <button onClick={() => setGateModalOpen(true)} className="btn btn-primary">
                <Plus size={16} />
                <span>Record Gate Event</span>
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="maritime-table">
                <thead>
                  <tr>
                    <th>Gate Activity</th>
                    <th>Container ID</th>
                    <th>Gate Terminal</th>
                    <th>Truck & Driver</th>
                    <th>Physical Seal Verified</th>
                    <th>Timestamp</th>
                    <th>Operator</th>
                  </tr>
                </thead>
                <tbody>
                  {portActivities.filter(a => a.activityType === 'GATE_IN' || a.activityType === 'GATE_OUT').length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                        No gate entries logged yet today. Click "Record Gate Event" to add an entry.
                      </td>
                    </tr>
                  ) : (
                    portActivities.filter(a => a.activityType === 'GATE_IN' || a.activityType === 'GATE_OUT').map((a) => (
                      <tr key={a.activityId}>
                        <td>
                          <span className={`badge ${a.activityType === 'GATE_IN' ? 'badge-green' : 'badge-blue'}`}>
                            {a.activityType === 'GATE_IN' ? 'Gate-In Arrival' : 'Gate-Out Dispatch'}
                          </span>
                        </td>
                        <td>
                          <strong style={{ color: '#0f172a' }}>{a.entityId}</strong>
                        </td>
                        <td>{a.details?.gateNumber || 'Gate 01'}</td>
                        <td>
                          <strong style={{ color: '#334155' }}>{a.details?.truckNumber}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Driver: {a.details?.driverName}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '11px', fontWeight: 700 }}>
                            <CheckCircle2 size={13} />
                            <code>{a.details?.sealNumber || 'SL-VERIFIED'}</code>
                          </div>
                        </td>
                        <td style={{ fontSize: '12px', color: '#64748b' }}>
                          {new Date(a.timestamp).toLocaleString()}
                        </td>
                        <td style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>
                          {a.performedBy}
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

      {/* =========================================================
          TAB 4: LOADING & UNLOADING QUEUE WORKSPACE
         ========================================================= */}
      {activeTab === 'loading' && (
        <div>
          <div className="maritime-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Vessel Loading & Unloading Queue
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Verify inspection status before approving loading onto ships
                </div>
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="maritime-table">
                <thead>
                  <tr>
                    <th>Container ID</th>
                    <th>Cargo Description</th>
                    <th>Target Vessel</th>
                    <th>Inspection Clearance</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Operation Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingQueueContainers.map((c) => {
                    const isFailed = failedInspectionsList.some(i => i.containerId === c.containerId);
                    return (
                      <tr key={c.containerId}>
                        <td>
                          <strong style={{ color: '#0f172a' }}>{c.containerId}</strong>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>Weight: {c.weightKg?.toLocaleString()} kg</div>
                        </td>
                        <td>{c.cargoDescription}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#0284c7', fontWeight: 600 }}>
                            <Ship size={14} />
                            <span>{c.assignedShipName || 'Awaiting Vessel Assignment'}</span>
                          </div>
                        </td>
                        <td>
                          {isFailed ? (
                            <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <AlertTriangle size={12} />
                              <span>Inspection Failed (Quarantine)</span>
                            </span>
                          ) : (
                            <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={12} />
                              <span>Passed & Cleared</span>
                            </span>
                          )}
                        </td>
                        <td>
                          <span className={`badge ${c.status === 'Loaded' ? 'badge-blue' : c.status === 'Unloading' ? 'badge-cyan' : 'badge-green'}`}>
                            {c.status}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {c.status !== 'Loaded' && (
                              <button
                                onClick={() => {
                                  if (isFailed) {
                                    showNotice('Cannot load container: Inspection failed. Must resolve hold with Inspector first.', true);
                                    return;
                                  }
                                  setLoadingModalContainer(c);
                                  setLoadingForm({ actionType: 'LOAD', shipId: c.assignedShipId || ships[0]?.shipId || '', craneNumber: 'Crane 02', notes: '' });
                                }}
                                className="btn btn-primary btn-sm"
                                disabled={isFailed}
                              >
                                <Ship size={13} />
                                <span>Confirm Loading</span>
                              </button>
                            )}

                            {c.status === 'Loaded' && (
                              <button
                                onClick={() => {
                                  setLoadingModalContainer(c);
                                  setLoadingForm({ actionType: 'UNLOAD', shipId: c.assignedShipId || '', craneNumber: 'Crane 01', notes: '' });
                                }}
                                className="btn btn-secondary btn-sm"
                              >
                                <span>Confirm Unload</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setHoldModalContainer(c);
                                setHoldForm({ reason: 'Quarantine hold applied by Port Manager', notes: '' });
                              }}
                              className="btn btn-outline btn-sm"
                              style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                            >
                              <span>Hold</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 5: INSPECTION COORDINATION & QUARANTINE HOLDS
         ========================================================= */}
      {activeTab === 'inspections' && (
        <div>
          {/* Failed Inspection Alert Banner */}
          {failedInspectionsList.length > 0 && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #f87171',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <AlertTriangle size={24} color="#dc2626" />
                <div>
                  <h4 style={{ margin: 0, color: '#991b1b', fontSize: '15px', fontWeight: 800 }}>
                    {failedInspectionsList.length} Container(s) Failed Safety / Customs Inspection!
                  </h4>
                  <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '2px' }}>
                    Loading locked. Coordinate with Customs Inspector to perform re-inspection or maintain Quarantine Hold.
                  </div>
                </div>
              </div>
              <button onClick={() => setRaiseIssueModalOpen(true)} className="btn btn-secondary btn-sm" style={{ background: '#fff', color: '#dc2626', borderColor: '#fca5a5' }}>
                <Send size={13} color="#dc2626" />
                <span>Alert Customs Inspector</span>
              </button>
            </div>
          )}

          <div className="maritime-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Customs & Safety Inspection Results
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Review container inspection certificates before dispatch or ship loading
                </div>
              </div>
              <button onClick={() => onNavigate('inspections')} className="btn btn-outline btn-sm">
                <span>All Inspection Records</span>
                <ArrowUpRight size={14} />
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="maritime-table">
                <thead>
                  <tr>
                    <th>Inspection ID</th>
                    <th>Container ID</th>
                    <th>Inspection Type</th>
                    <th>Inspector</th>
                    <th>Result Status</th>
                    <th>Seal Status</th>
                    <th style={{ textAlign: 'right' }}>Manager Action</th>
                  </tr>
                </thead>
                <tbody>
                  {inspections.map((ins) => {
                    const isPassed = ins.result === 'Passed';
                    return (
                      <tr key={ins.inspectionId}>
                        <td><code>{ins.inspectionId}</code></td>
                        <td><strong style={{ color: '#0f172a' }}>{ins.containerId}</strong></td>
                        <td>{ins.inspectionType}</td>
                        <td>{ins.inspectorName}</td>
                        <td>
                          <span className={`badge ${isPassed ? 'badge-green' : 'badge-red'}`}>
                            {ins.result}
                          </span>
                        </td>
                        <td>
                          {ins.sealIntact ? (
                            <span style={{ color: '#10b981', fontSize: '12px', fontWeight: 700 }}>✅ Intact</span>
                          ) : (
                            <span style={{ color: '#ef4444', fontSize: '12px', fontWeight: 700 }}>⚠️ Compromised</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            {isPassed ? (
                              <button
                                onClick={async () => {
                                  try {
                                    await api.containers.updateStatus(ins.containerId, {
                                      status: 'Ready for Loading',
                                      notes: 'Approved for loading following passed inspection certificate'
                                    });
                                    showNotice(`Container ${ins.containerId} approved for vessel loading`);
                                    await loadAllPortData();
                                  } catch (e) {
                                    showNotice(e.message, true);
                                  }
                                }}
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#0284c7' }}
                              >
                                <CheckCircle size={13} color="#0284c7" />
                                <span>Approve Loading</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setHoldModalContainer({ containerId: ins.containerId });
                                  setHoldForm({ reason: `Failed ${ins.inspectionType} inspection: ${ins.notes || 'Discrepancy noted'}`, notes: '' });
                                }}
                                className="btn btn-outline btn-sm"
                                style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                              >
                                <span>Lock in Quarantine</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 6: PORT ACTIVITY HISTORY & DELAYS
         ========================================================= */}
      {activeTab === 'activities' && (
        <div>
          <div className="maritime-card" style={{ padding: '22px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Recorded Port Operations Audit Stream
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Every gate entry, yard stacking, crane operation, and berth change is permanently recorded
                </div>
              </div>
              <button onClick={() => setPortLogModalOpen(true)} className="btn btn-primary btn-sm">
                <Plus size={14} />
                <span>Log Activity</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {portActivities.map((act) => (
                <div
                  key={act.activityId}
                  style={{
                    padding: '14px 18px',
                    borderRadius: '8px',
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className={`badge ${
                        act.activityType === 'GATE_IN' ? 'badge-green' :
                        act.activityType === 'GATE_OUT' ? 'badge-blue' :
                        act.activityType === 'BERTH_ALLOCATION' ? 'badge-purple' :
                        act.activityType === 'OPERATIONAL_DELAY' ? 'badge-amber' : 'badge-cyan'
                      }`}>
                        {act.activityType}
                      </span>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{act.entityId}</strong>
                    </div>
                    <div style={{ fontSize: '13px', color: '#334155' }}>
                      {act.details?.notes || `Operation completed at ${act.port}`}
                    </div>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                      Performed by: <strong>{act.performedBy}</strong> ({act.userRole}) &bull; {new Date(act.timestamp).toLocaleString()}
                    </div>
                  </div>

                  {act.auditId && (
                    <div style={{ fontSize: '11px', color: '#0284c7', fontFamily: 'monospace' }}>
                      Audit ID: {act.auditId}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 1: GATE ENTRY / EXIT MODAL
         ========================================================= */}
      {gateModalOpen && (
        <div className="modal-overlay" onClick={() => setGateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Truck size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Record Gate Entry / Exit</h3>
              </div>
              <button onClick={() => setGateModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleRecordGate} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Gate Operation Type:</label>
                <select
                  className="select-control"
                  value={gateForm.gateType}
                  onChange={(e) => setGateForm({ ...gateForm, gateType: e.target.value })}
                >
                  <option value="GATE_IN">Gate-In (Truck Arrival with Container from Inland)</option>
                  <option value="GATE_OUT">Gate-Out (Container Cleared & Dispatched Out of Port)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Container ID:</label>
                <select
                  className="select-control"
                  value={gateForm.containerId}
                  onChange={(e) => setGateForm({ ...gateForm, containerId: e.target.value })}
                  required
                >
                  <option value="">-- Select Container --</option>
                  {containers.map(c => (
                    <option key={c.containerId} value={c.containerId}>
                      {c.containerId} &bull; {c.cargoDescription} ({c.status})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Gate Lane:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={gateForm.gateNumber}
                    onChange={(e) => setGateForm({ ...gateForm, gateNumber: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Truck License Plate:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={gateForm.truckNumber}
                    onChange={(e) => setGateForm({ ...gateForm, truckNumber: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Driver Name:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={gateForm.driverName}
                    onChange={(e) => setGateForm({ ...gateForm, driverName: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Physical Seal #:</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. SL-88910-SEC"
                    value={gateForm.sealNumber}
                    onChange={(e) => setGateForm({ ...gateForm, sealNumber: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Manifest Notes / Weight Check:</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Weight weighbridge passed: 24,100 kg. Seal intact."
                  value={gateForm.notes}
                  onChange={(e) => setGateForm({ ...gateForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setGateModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Recording...' : 'Record Gate Pass'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 2: ASSIGN YARD SLOT MODAL
         ========================================================= */}
      {yardModalContainer && (
        <div className="modal-overlay" onClick={() => setYardModalContainer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Grid size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Assign Yard Stacking Slot</h3>
              </div>
              <button onClick={() => setYardModalContainer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleAssignYardSlot} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Assigning container <strong style={{ color: '#0f172a' }}>{yardModalContainer.containerId}</strong> to yard position.
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Yard Block:</label>
                  <select
                    className="select-control"
                    value={yardForm.yardBlock}
                    onChange={(e) => setYardForm({ ...yardForm, yardBlock: e.target.value })}
                  >
                    <option value="A">Block A (Export Dry Heavy)</option>
                    <option value="B">Block B (General Cargo)</option>
                    <option value="C">Block C (Reefer Cold Chain)</option>
                    <option value="D">Block D (Dangerous / Quarantine)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Bay Number (01-20):</label>
                  <input
                    type="text"
                    className="input-control"
                    value={yardForm.yardBay}
                    onChange={(e) => setYardForm({ ...yardForm, yardBay: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Row (01-10):</label>
                  <input
                    type="text"
                    className="input-control"
                    value={yardForm.yardRow}
                    onChange={(e) => setYardForm({ ...yardForm, yardRow: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Tier Height (1-5):</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    className="input-control"
                    value={yardForm.yardTier}
                    onChange={(e) => setYardForm({ ...yardForm, yardTier: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Re-stacking / Staging Notes:</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Staged for vessel Ever Given departure on Friday."
                  value={yardForm.notes}
                  onChange={(e) => setYardForm({ ...yardForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setYardModalContainer(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Assigning...' : 'Save Stacking Position'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 3: ASSIGN / UPDATE BERTH MODAL
         ========================================================= */}
      {berthModalBerth && (
        <div className="modal-overlay" onClick={() => setBerthModalBerth(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Anchor size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Berth Management: {berthModalBerth.berthId}</h3>
              </div>
              <button onClick={() => setBerthModalBerth(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleUpdateBerth} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Target Berth / Dock:</label>
                <select
                  className="select-control"
                  value={berthModalBerth.berthId}
                  onChange={(e) => {
                    const found = berthsData?.berths?.find(b => b.berthId === e.target.value);
                    if (found) {
                      setBerthModalBerth(found);
                    } else {
                      setBerthModalBerth({ ...berthModalBerth, berthId: e.target.value });
                    }
                  }}
                >
                  {(berthsData?.berths || [berthModalBerth]).map(b => (
                    <option key={b.berthId} value={b.berthId}>
                      {b.berthId} {b.vessel ? `(${b.vessel})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Select Vessel:</label>
                <select
                  className="select-control"
                  value={berthForm.shipId}
                  onChange={(e) => {
                    const selectedShip = ships.find(s => s.shipId === e.target.value);
                    setBerthForm({
                      ...berthForm,
                      shipId: e.target.value,
                      vessel: selectedShip ? selectedShip.name : 'Available / Open',
                      imo: selectedShip ? selectedShip.imoNumber : 'N/A'
                    });
                  }}
                >
                  <option value="">-- Available / Open Berth --</option>
                  {ships.map(s => (
                    <option key={s.shipId} value={s.shipId}>
                      {s.name} ({s.imoNumber}) &bull; {s.status}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Berth Status:</label>
                <select
                  className="select-control"
                  value={berthForm.status}
                  onChange={(e) => setBerthForm({ ...berthForm, status: e.target.value })}
                >
                  <option value="Docked & Unloading">Docked & Unloading</option>
                  <option value="Docked & Loading">Docked & Loading</option>
                  <option value="Scheduled Arrival">Scheduled Arrival</option>
                  <option value="Ready to Depart">Ready to Depart</option>
                  <option value="Ready for Berthing">Ready for Berthing (Open)</option>
                  <option value="Maintenance / Crane Inspection">Maintenance / Crane Inspection</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Allocated Cranes:</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    className="input-control"
                    value={berthForm.cranesActive}
                    onChange={(e) => setBerthForm({ ...berthForm, cranesActive: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Cargo Throughput:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={berthForm.teuThroughput}
                    onChange={(e) => setBerthForm({ ...berthForm, teuThroughput: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Operational Notes:</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Berth cleared for night departure pilot."
                  value={berthForm.notes}
                  onChange={(e) => setBerthForm({ ...berthForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setBerthModalBerth(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Updating...' : 'Save Berth Allocation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 4: LOADING / UNLOADING CONFIRMATION MODAL
         ========================================================= */}
      {loadingModalContainer && (
        <div className="modal-overlay" onClick={() => setLoadingModalContainer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ship size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Confirm Vessel Cargo Operation</h3>
              </div>
              <button onClick={() => setLoadingModalContainer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleExecuteLoadingAction} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Container: <strong style={{ color: '#0f172a' }}>{loadingModalContainer.containerId}</strong> &bull; Cargo: <strong>{loadingModalContainer.cargoDescription}</strong>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Action Type:</label>
                <select
                  className="select-control"
                  value={loadingForm.actionType}
                  onChange={(e) => setLoadingForm({ ...loadingForm, actionType: e.target.value })}
                >
                  <option value="LOAD">Load onto Vessel (Quay Crane ➔ Vessel Hold)</option>
                  <option value="UNLOAD">Unload from Vessel (Vessel Hold ➔ Quay Staging)</option>
                </select>
              </div>

              {loadingForm.actionType === 'LOAD' && (
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Target Ship:</label>
                  <select
                    className="select-control"
                    value={loadingForm.shipId}
                    onChange={(e) => setLoadingForm({ ...loadingForm, shipId: e.target.value })}
                    required
                  >
                    <option value="">-- Select Vessel --</option>
                    {ships.map(s => (
                      <option key={s.shipId} value={s.shipId}>
                        {s.name} ({s.imoNumber}) &bull; {s.destination}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Quay Crane ID:</label>
                <input
                  type="text"
                  className="input-control"
                  value={loadingForm.craneNumber}
                  onChange={(e) => setLoadingForm({ ...loadingForm, craneNumber: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Loading Time / Verification Notes:</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Physical seal verified before spreader engagement."
                  value={loadingForm.notes}
                  onChange={(e) => setLoadingForm({ ...loadingForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setLoadingModalContainer(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Processing...' : 'Confirm & Write to Audit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 5: QUARANTINE HOLD MODAL
         ========================================================= */}
      {holdModalContainer && (
        <div className="modal-overlay" onClick={() => setHoldModalContainer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertTriangle size={18} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#991b1b' }}>Place on Quarantine Hold</h3>
              </div>
              <button onClick={() => setHoldModalContainer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleHoldContainer} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ fontSize: '13px', color: '#64748b' }}>
                Applying hold for container <strong style={{ color: '#0f172a' }}>{holdModalContainer.containerId}</strong>. This will block vessel loading and trigger an automated alert to Customs Inspector & Admin.
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Quarantine Hold Reason:</label>
                <select
                  className="select-control"
                  value={holdForm.reason}
                  onChange={(e) => setHoldForm({ ...holdForm, reason: e.target.value })}
                >
                  <option value="Security seal discrepancy detected at gate">Security seal discrepancy detected at gate</option>
                  <option value="Failed customs physical inspection">Failed customs physical inspection</option>
                  <option value="Cold chain reefer temperature excursion">Cold chain reefer temperature excursion</option>
                  <option value="Weight mismatch exceeds IMO SOLAS tolerance">Weight mismatch exceeds IMO SOLAS tolerance</option>
                  <option value="Dangerous goods manifest undeclared">Dangerous goods manifest undeclared</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Officer Justification Notes:</label>
                <textarea
                  className="input-control"
                  rows={3}
                  placeholder="Detailed observations for inspector..."
                  value={holdForm.notes}
                  onChange={(e) => setHoldForm({ ...holdForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setHoldModalContainer(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }}>
                  {actionLoading ? 'Applying Hold...' : 'Lock Container in Quarantine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 6: REPORT OPERATIONAL DELAY MODAL
         ========================================================= */}
      {delayModalOpen && (
        <div className="modal-overlay" onClick={() => setDelayModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} color="#b45309" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Record Operational Delay / Exception</h3>
              </div>
              <button onClick={() => setDelayModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleRecordDelay} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Impacted Entity Type:</label>
                  <select
                    className="select-control"
                    value={delayForm.entityType}
                    onChange={(e) => setDelayForm({ ...delayForm, entityType: e.target.value })}
                  >
                    <option value="Ship">Ship / Vessel</option>
                    <option value="Container">Container Cargo</option>
                    <option value="Berth">Berth / Quay Crane</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Identifier (Ship or Container):</label>
                  <input
                    type="text"
                    className="input-control"
                    placeholder="e.g. MSC Irina or MSCU-7492014"
                    value={delayForm.entityId}
                    onChange={(e) => setDelayForm({ ...delayForm, entityId: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Delay Reason:</label>
                <select
                  className="select-control"
                  value={delayForm.delayReason}
                  onChange={(e) => setDelayForm({ ...delayForm, delayReason: e.target.value })}
                >
                  <option value="Monsoon weather & swell restriction">Monsoon weather & swell restriction</option>
                  <option value="Quay crane mechanical breakdown">Quay crane mechanical breakdown</option>
                  <option value="Anchorage pilot queue congestion">Anchorage pilot queue congestion</option>
                  <option value="Customs inspection clearance hold">Customs inspection clearance hold</option>
                  <option value="Yard congestion & reach stacker delay">Yard congestion & reach stacker delay</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Estimated Delay Duration (Hours):</label>
                <input
                  type="number"
                  min="1"
                  className="input-control"
                  value={delayForm.estimatedDelayHours}
                  onChange={(e) => setDelayForm({ ...delayForm, estimatedDelayHours: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Mitigation Plan:</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Reassigned to Crane 04 upon berth clearance."
                  value={delayForm.notes}
                  onChange={(e) => setDelayForm({ ...delayForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setDelayModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Recording...' : 'Record Delay Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 7: LOG CUSTOM PORT ACTIVITY MODAL
         ========================================================= */}
      {portLogModalOpen && (
        <div className="modal-overlay" onClick={() => setPortLogModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ClipboardList size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Confirm Port Activity Record</h3>
              </div>
              <button onClick={() => setPortLogModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleLogPortActivity} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Activity Category:</label>
                <select
                  className="select-control"
                  value={portLogForm.activityType}
                  onChange={(e) => setPortLogForm({ ...portLogForm, activityType: e.target.value })}
                >
                  <option value="GENERAL_OPERATION">General Port Operation</option>
                  <option value="BERTH_ALLOCATION">Berth & Quay Management</option>
                  <option value="YARD_STACKING">Yard Re-stacking Operation</option>
                  <option value="INSPECTION_COORDINATION">Customs & Safety Coordination</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Activity Summary Title:</label>
                <input
                  type="text"
                  className="input-control"
                  value={portLogForm.title}
                  onChange={(e) => setPortLogForm({ ...portLogForm, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Detailed Observation Notes:</label>
                <textarea
                  className="input-control"
                  rows={3}
                  placeholder="Record full details into the immutable activity audit log..."
                  value={portLogForm.notes}
                  onChange={(e) => setPortLogForm({ ...portLogForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setPortLogModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Saving...' : 'Add to Audit Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 8: RAISE ISSUE TICKET FOR INSPECTOR / ADMIN
         ========================================================= */}
      {raiseIssueModalOpen && (
        <div className="modal-overlay" onClick={() => setRaiseIssueModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Raise Issue for Inspector or Admin</h3>
              </div>
              <button onClick={() => setRaiseIssueModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleRaiseIssue} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Send Ticket To:</label>
                <select
                  className="select-control"
                  value={issueForm.targetRole}
                  onChange={(e) => setIssueForm({ ...issueForm, targetRole: e.target.value })}
                >
                  <option value="Inspector">Customs & Safety Inspector (Re-inspection request)</option>
                  <option value="Admin">System Admin (Security or entity review)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Related Container or Ship ID:</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. MSCU-7492014"
                  value={issueForm.entityId}
                  onChange={(e) => setIssueForm({ ...issueForm, entityId: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Issue Subject:</label>
                <input
                  type="text"
                  className="input-control"
                  value={issueForm.title}
                  onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Message Details:</label>
                <textarea
                  className="input-control"
                  rows={3}
                  value={issueForm.message}
                  onChange={(e) => setIssueForm({ ...issueForm, message: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setRaiseIssueModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Sending...' : 'Send Issue Ticket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================
          MODAL 9: PORT OPERATIONS REPORT SUMMARY MODAL
         ========================================================= */}
      {reportModalOpen && reportData && (
        <div className="modal-overlay" onClick={() => setReportModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>{assignedPort} Operational Report</h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => window.print()} className="btn btn-secondary btn-sm">
                  <Printer size={14} />
                  <span>Print</span>
                </button>
                <button onClick={() => setReportModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
              </div>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>PORT PERFORMANCE SUMMARY</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{assignedPort} Daily Report</div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Generated on: {new Date(reportData.generatedAt).toLocaleString()}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Containers in Port</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{reportData.summary?.totalContainersInPort} Units</div>
                </div>
                <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Berth Occupancy Rate</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0284c7' }}>{reportData.summary?.berthOccupancyRate}</div>
                </div>
                <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Today's Gate Movements</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a' }}>{reportData.summary?.gateInToday} In / {reportData.summary?.gateOutToday} Out</div>
                </div>
                <div style={{ padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>Inspection Compliance</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#10b981' }}>{reportData.summary?.inspectionComplianceRate}</div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>Recent Operational Activities Logged:</div>
                <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {reportData.recentActivities?.map((a, i) => (
                    <div key={i} style={{ fontSize: '11px', color: '#475569', padding: '6px 10px', background: '#f8fafc', borderRadius: '4px', border: '1px solid #f1f5f9' }}>
                      <strong>{a.activityType}</strong> &bull; {a.entityId}: {a.details?.notes || 'Completed'} &bull; <em>{new Date(a.timestamp).toLocaleTimeString()}</em>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                <button onClick={() => setReportModalOpen(false)} className="btn btn-primary">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PortManagerDashboard;
