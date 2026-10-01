import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  ClipboardCheck,
  ShieldCheck,
  AlertTriangle,
  Camera,
  CheckCircle,
  XCircle,
  Clock,
  Box,
  ArrowUpRight,
  FolderLock,
  FileCheck,
  Sparkles,
  Plus,
  Search,
  CheckCircle2,
  X,
  AlertCircle,
  FileText,
  Send,
  MapPin,
  Maximize2,
  Wrench,
  RotateCcw,
  Sliders,
  Radio,
  Image as ImageIcon
} from 'lucide-react';

export const InspectorDashboard = ({ onNavigate }) => {
  const { user } = useAuth();
  const [containers, setContainers] = useState([]);
  const [inspections, setInspections] = useState([]);
  const [evidenceList, setEvidenceList] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'workbench', 'failed', 'reinspection', 'evidence'
  const [searchQuery, setSearchQuery] = useState('');
  const [resultFilter, setResultFilter] = useState('ALL');

  // Active Modals
  const [inspectionModalContainer, setInspectionModalContainer] = useState(null);
  const [holdModalContainer, setHoldModalContainer] = useState(null);
  const [reinspectionModalItem, setReinspectionModalItem] = useState(null);
  const [photoUploadModalOpen, setPhotoUploadModalOpen] = useState(false);
  const [selectedPhotoPreview, setSelectedPhotoPreview] = useState(null);

  // Workbench Form State
  const [workbenchForm, setWorkbenchForm] = useState({
    containerId: '',
    expectedSeal: '',
    physicalSeal: '',
    inspectionType: 'Safety & Structural',
    temperatureRecorded: '',
    overallResult: 'Passed',
    recommendation: 'Approve for Sea Loading',
    notes: '',
    checklist: [
      { item: '1. Doors, Locks, Hinges & Rubber Gaskets', status: 'Pass', passed: true, comments: 'Gaskets airtight, locking bars operational', defectType: '', severity: null },
      { item: '2. Left & Right Structural Walls / Panels', status: 'Pass', passed: true, comments: 'No major dents or structural deformation', defectType: '', severity: null },
      { item: '3. Ceiling & Roof Sheets (Corrosion & Pinhole check)', status: 'Pass', passed: true, comments: 'Water-tight seal verified', defectType: '', severity: null },
      { item: '4. Wooden / Steel Floor & Crossmembers', status: 'Pass', passed: true, comments: 'Clean, oil-free, no broken floorboards', defectType: '', severity: null },
      { item: '5. Corner Castings & Twistlock Apertures', status: 'Pass', passed: true, comments: 'ISO 1161 corner castings intact', defectType: '', severity: null },
      { item: '6. Dangerous Goods Hazard Labels & IMDG Placards', status: 'Pass', passed: true, comments: 'Correct placards displayed', defectType: '', severity: null },
      { item: '7. Cold-Chain Machinery & Reefer Cables', status: 'N/A', passed: true, comments: 'Ambient cargo (Dry unit)', defectType: '', severity: null }
    ],
    defects: [],
    photos: []
  });

  const [holdForm, setHoldForm] = useState({
    reason: 'Security bolt seal mismatch against manifest declaration',
    notes: ''
  });

  const [reinspectionForm, setReinspectionForm] = useState({
    reason: 'Corner casting micro-crack requires welding certification',
    priority: 'High',
    deadlineHours: 24,
    notes: ''
  });

  const [photoForm, setPhotoForm] = useState({
    containerId: '',
    fileName: 'seal-inspection-photo.jpg',
    category: 'Seal Photo',
    caption: 'High-security ISO 17712 bolt seal inspection proof',
    fileUrl: '/assets/cargo-seal.jpg'
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadInspectorData();
  }, []);

  const showNotice = (msg, isError = false) => {
    setNotification({ msg, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  const loadInspectorData = async () => {
    setLoading(true);
    try {
      const [allContainers, allInspections, allEvidence, statsRes] = await Promise.all([
        api.containers.getAll(),
        api.inspections.getAll(),
        api.evidence.getAll(),
        api.inspections.getStats()
      ]);
      setContainers(allContainers || []);
      setInspections(allInspections || []);
      setEvidenceList(allEvidence || []);
      setStats(statsRes || null);
    } catch (e) {
      console.error('Failed to load inspector data:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredContainers = containers.filter(c =>
    !searchQuery ||
    c.containerId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.cargoDescription?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.sealNumber?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pendingContainers = filteredContainers.filter(c =>
    c.status === 'Booked' || c.status === 'Ready for Loading' || c.status === 'Under Inspection'
  );

  const failedInspections = inspections.filter(i =>
    i.result === 'Failed' || i.result === 'Flagged for Quarantine' || i.status === 'Failed' || i.status === 'On Hold'
  );

  const reinspectionList = inspections.filter(i =>
    i.result === 'Requires Re-inspection' || i.status === 'Re-inspection Required' || i.status === 'Repair Required'
  );

  // Setup Workbench for a Container
  const handleSelectForWorkbench = (c) => {
    setWorkbenchForm({
      containerId: c.containerId,
      expectedSeal: c.sealNumber || 'SL-88910-SEC',
      physicalSeal: c.sealNumber || 'SL-88910-SEC',
      inspectionType: c.hazardClass && c.hazardClass !== 'Non-Hazardous' ? 'Dangerous Goods Compliance' : c.temperatureCelsius !== null ? 'Reefer Temp & Integrity' : 'Safety & Structural',
      temperatureRecorded: c.temperatureCelsius !== null && c.temperatureCelsius !== undefined ? String(c.temperatureCelsius) : '',
      overallResult: 'Passed',
      recommendation: 'Approve for Sea Loading',
      notes: `Inspected at ${user?.assignedPort || 'Mumbai Customs Bay'}. Physical seal intact and verified.`,
      checklist: [
        { item: '1. Doors, Locks, Hinges & Rubber Gaskets', status: 'Pass', passed: true, comments: 'Gaskets airtight, locking bars operational', defectType: '', severity: null },
        { item: '2. Left & Right Structural Walls / Panels', status: 'Pass', passed: true, comments: 'No major dents or deformation', defectType: '', severity: null },
        { item: '3. Ceiling & Roof Sheets (Corrosion check)', status: 'Pass', passed: true, comments: 'Water-tight seal verified', defectType: '', severity: null },
        { item: '4. Wooden / Steel Floor & Crossmembers', status: 'Pass', passed: true, comments: 'Clean, oil-free, no broken floorboards', defectType: '', severity: null },
        { item: '5. Corner Castings & Twistlock Apertures', status: 'Pass', passed: true, comments: 'ISO 1161 corner castings intact', defectType: '', severity: null },
        { item: '6. Dangerous Goods Hazard Labels & IMDG Placards', status: c.hazardClass && c.hazardClass !== 'Non-Hazardous' ? 'Pass' : 'N/A', passed: true, comments: c.hazardClass || 'Non-Hazardous', defectType: '', severity: null },
        { item: '7. Cold-Chain Machinery & Reefer Cables', status: c.temperatureCelsius !== null ? 'Pass' : 'N/A', passed: true, comments: c.temperatureCelsius !== null ? `${c.temperatureCelsius}°C Reefer OK` : 'Ambient Dry Cargo', defectType: '', severity: null }
      ],
      defects: [],
      photos: [
        { fileName: `${c.containerId}-seal-proof.jpg`, caption: 'Physical bolt seal verification photograph' }
      ]
    });
    setActiveTab('workbench');
  };

  // Toggle Checklist item
  const handleToggleChecklist = (index, newStatus) => {
    const updated = [...workbenchForm.checklist];
    updated[index].status = newStatus;
    updated[index].passed = newStatus === 'Pass' || newStatus === 'N/A';

    // Auto calculate recommendation
    const hasFailures = updated.some(item => item.status === 'Fail');
    const sealMismatch = workbenchForm.expectedSeal && workbenchForm.physicalSeal && workbenchForm.expectedSeal.trim().toUpperCase() !== workbenchForm.physicalSeal.trim().toUpperCase();

    let newResult = 'Passed';
    let newRec = 'Approve for Sea Loading';

    if (hasFailures || sealMismatch) {
      newResult = 'Failed';
      newRec = sealMismatch ? 'Quarantine for Security Seal Discrepancy' : 'Hold Container & Request Repair';
    }

    setWorkbenchForm({
      ...workbenchForm,
      checklist: updated,
      overallResult: newResult,
      recommendation: newRec
    });
  };

  // Submit Completed Inspection from Workbench
  const handleSubmitInspection = async (e) => {
    e.preventDefault();
    if (!workbenchForm.containerId) {
      showNotice('Please select a container to inspect', true);
      return;
    }
    setActionLoading(true);
    try {
      const sealMatch = workbenchForm.expectedSeal.trim().toUpperCase() === workbenchForm.physicalSeal.trim().toUpperCase();
      const res = await api.inspections.create({
        containerId: workbenchForm.containerId,
        port: user?.assignedPort || 'Mumbai Customs Bay',
        inspectionType: workbenchForm.inspectionType,
        result: workbenchForm.overallResult,
        expectedSealNumber: workbenchForm.expectedSeal,
        physicalSealNumber: workbenchForm.physicalSeal,
        sealIntact: sealMatch,
        temperatureRecorded: workbenchForm.temperatureRecorded ? Number(workbenchForm.temperatureRecorded) : null,
        checklist: workbenchForm.checklist,
        defectsDetected: workbenchForm.defects,
        recommendation: workbenchForm.recommendation,
        notes: workbenchForm.notes,
        photographs: workbenchForm.photos,
        deviceInfo: 'Inspector Rugged Tablet Pro #04',
        gpsLocation: { lat: 18.94, lng: 72.83 }
      });

      showNotice(res.message || 'Inspection submitted and recorded in audit trail');
      await loadInspectorData();
      setActiveTab('queue');
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
        port: user?.assignedPort || 'Mumbai Customs'
      });
      showNotice(res.message || 'Container placed on hold');
      setHoldModalContainer(null);
      await loadInspectorData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestReinspection = async (e) => {
    e.preventDefault();
    if (!reinspectionModalItem) return;
    setActionLoading(true);
    try {
      const res = await api.inspections.requestReinspection(reinspectionModalItem.inspectionId, reinspectionForm);
      showNotice(res.message || 'Re-inspection requested');
      setReinspectionModalItem(null);
      await loadInspectorData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUploadPhoto = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.evidence.attach({
        containerId: photoForm.containerId || containers[0]?.containerId,
        fileName: photoForm.fileName,
        category: photoForm.category,
        uploadedBy: user?.name || 'Inspector Officer',
        notes: photoForm.caption
      });
      showNotice('Inspection photo evidence sealed with SHA-256 hash');
      setPhotoUploadModalOpen(false);
      await loadInspectorData();
    } catch (err) {
      showNotice(err.message, true);
    } finally {
      setActionLoading(false);
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

      {/* Customs Inspector Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '1px' }}>
              CUSTOMS & SAFETY INSPECTION BAY
            </span>
            <span className="badge badge-amber" style={{ fontSize: '10px' }}>INSPECTOR</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.4px' }}>
            Container Safety & Customs Inspection Center
          </h1>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
            Inspector Officer: <strong style={{ color: '#0f172a' }}>{user?.name}</strong> &bull; Station: <strong>{user?.assignedPort || 'Mumbai Customs Bay 4'}</strong> &bull; Compliance Standard: <strong>ISO 17712 / IMDG</strong>
          </div>
        </div>

        {/* Global Quick Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              if (pendingContainers.length > 0) {
                handleSelectForWorkbench(pendingContainers[0]);
              } else {
                setActiveTab('workbench');
              }
            }}
            className="btn btn-primary btn-sm"
          >
            <ClipboardCheck size={14} />
            <span>Open Workbench</span>
          </button>
          <button onClick={() => setPhotoUploadModalOpen(true)} className="btn btn-secondary btn-sm" style={{ color: '#0284c7' }}>
            <Camera size={14} color="#0284c7" />
            <span>Upload Photo</span>
          </button>
          <button onClick={() => onNavigate('evidence')} className="btn btn-secondary btn-sm">
            <FolderLock size={14} color="#0f3460" />
            <span>Photo Vault</span>
          </button>
        </div>
      </div>

      {/* 6 Key Inspector KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '14px',
        marginBottom: '24px'
      }}>
        {/* Assigned & Pending */}
        <div className="maritime-card" style={{ padding: '16px', borderLeft: '4px solid #0284c7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>To Inspect</span>
            <ClipboardCheck size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {pendingContainers.length} Units
          </div>
          <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px', fontWeight: 600 }}>
            Awaiting Clearance
          </div>
        </div>

        {/* Passed & Cleared */}
        <div className="maritime-card" style={{ padding: '16px', borderLeft: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Passed</span>
            <CheckCircle size={16} color="#10b981" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {stats?.passed || inspections.filter(i => i.result === 'Passed').length || 18} Passed
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px', fontWeight: 600 }}>
            Pass Rate: {stats?.passRate || '96%'}
          </div>
        </div>

        {/* Failed / Flagged */}
        <div className="maritime-card" style={{ padding: '16px', borderLeft: '4px solid #dc2626' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Failed</span>
            <XCircle size={16} color="#dc2626" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#dc2626' }}>
            {failedInspections.length} Failed
          </div>
          <div style={{ fontSize: '11px', color: '#dc2626', marginTop: '2px', fontWeight: 600 }}>
            Quarantine Lock Active
          </div>
        </div>

        {/* On Hold / Repair */}
        <div className="maritime-card" style={{ padding: '16px', borderLeft: '4px solid #b45309' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>On Hold / Repair</span>
            <Wrench size={16} color="#b45309" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {containers.filter(c => c.status === 'Flagged' || c.isDelayed).length} Containers
          </div>
          <div style={{ fontSize: '11px', color: '#b45309', marginTop: '2px', fontWeight: 600 }}>
            Maintenance Queue
          </div>
        </div>

        {/* Re-inspections */}
        <div className="maritime-card" style={{ padding: '16px', borderLeft: '4px solid #7c3aed' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Re-Inspections</span>
            <RotateCcw size={16} color="#7c3aed" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {reinspectionList.length || 1} Pending
          </div>
          <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '2px', fontWeight: 600 }}>
            Scheduled Follow-ups
          </div>
        </div>

        {/* Photo Evidence Count */}
        <div className="maritime-card" style={{ padding: '16px', borderLeft: '4px solid #0f3460' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Photo Proof</span>
            <Camera size={16} color="#0f3460" />
          </div>
          <div style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>
            {evidenceList.length || 8} Photos
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
            SHA-256 Hash Sealed
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '2px solid #e2e8f0',
        marginBottom: '22px',
        overflowX: 'auto',
        paddingBottom: '2px'
      }}>
        {[
          { id: 'queue', label: '1. Assigned Inspection Queue', icon: ClipboardCheck },
          { id: 'workbench', label: '2. 7-Point Safety Inspection Workbench', icon: Sliders },
          { id: 'failed', label: '3. Failed Inspections & Quarantine Holds', icon: AlertTriangle },
          { id: 'reinspection', label: '4. Re-Inspection & Repair Requests', icon: RotateCcw },
          { id: 'evidence', label: '5. Certified Photo Evidence Vault', icon: Camera }
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
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} color={isActive ? '#0284c7' : '#64748b'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =========================================================
          TAB 1: ASSIGNED INSPECTION QUEUE
         ========================================================= */}
      {activeTab === 'queue' && (
        <div>
          <div className="maritime-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Containers Queued for Customs & Safety Inspection ({pendingContainers.length})
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Select any container to open the interactive 7-point checklist and verify physical seals
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Search container ID, seal, cargo..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="input-control"
                  style={{ width: '240px', fontSize: '12px' }}
                />
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="maritime-table">
                <thead>
                  <tr>
                    <th>Container ID</th>
                    <th>Cargo Description</th>
                    <th>Manifest Seal #</th>
                    <th>Location / Vessel</th>
                    <th>Risk Rating</th>
                    <th style={{ textAlign: 'right' }}>Inspection Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingContainers.map((c) => (
                    <tr key={c.containerId}>
                      <td>
                        <strong style={{ color: '#0f172a', fontSize: '14px' }}>{c.containerId}</strong>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{c.type} &bull; {c.weightKg?.toLocaleString()} kg</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{c.cargoDescription}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Owner: {c.ownerCompany}</div>
                      </td>
                      <td>
                        <code style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700 }}>{c.sealNumber}</code>
                      </td>
                      <td>
                        <div>{c.currentLocation}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>Carrier: {c.assignedShipName || 'Yard Staged'}</div>
                      </td>
                      <td>
                        <span className={`badge ${c.riskLevel === 'Low' ? 'badge-green' : c.riskLevel === 'Medium' ? 'badge-amber' : 'badge-red'}`}>
                          {c.riskLevel} ({c.riskScore})
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => handleSelectForWorkbench(c)}
                            className="btn btn-primary btn-sm"
                          >
                            <ClipboardCheck size={13} />
                            <span>Start 7-Point Check</span>
                          </button>
                          <button
                            onClick={() => {
                              setHoldModalContainer(c);
                              setHoldForm({ reason: 'Suspicious physical condition detected at quay', notes: '' });
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ color: '#dc2626', borderColor: '#fca5a5' }}
                          >
                            <span>Hold</span>
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
          TAB 2: 7-POINT SAFETY INSPECTION WORKBENCH
         ========================================================= */}
      {activeTab === 'workbench' && (
        <div>
          <form onSubmit={handleSubmitInspection} className="maritime-card" style={{ padding: '24px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase' }}>ACTIVE INSPECTION WORKBENCH</div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Safety & Physical Condition Inspection
                </h3>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <select
                  className="select-control"
                  value={workbenchForm.containerId}
                  onChange={(e) => {
                    const sel = containers.find(c => c.containerId === e.target.value);
                    if (sel) handleSelectForWorkbench(sel);
                  }}
                  style={{ minWidth: '220px', fontWeight: 700 }}
                  required
                >
                  <option value="">-- Select Container to Inspect --</option>
                  {containers.map(c => (
                    <option key={c.containerId} value={c.containerId}>
                      {c.containerId} ({c.cargoDescription.substring(0, 18)}...)
                    </option>
                  ))}
                </select>

                <select
                  className="select-control"
                  value={workbenchForm.inspectionType}
                  onChange={(e) => setWorkbenchForm({ ...workbenchForm, inspectionType: e.target.value })}
                >
                  <option value="Safety & Structural">Safety & Structural Check</option>
                  <option value="Customs & Border Control">Customs & Border Control</option>
                  <option value="Reefer Temp & Integrity">Reefer Temp & Cold Chain</option>
                  <option value="Dangerous Goods Compliance">Dangerous Goods / IMDG</option>
                  <option value="Seal Verification">High-Security Seal Verification</option>
                </select>
              </div>
            </div>

            {/* Step 1: Seal Verification Comparison Box */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              borderRadius: '12px',
              padding: '18px 22px',
              marginBottom: '22px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
                <strong style={{ fontSize: '14px', color: '#0f172a' }}>
                  Step 1: ISO 17712 High-Security Bolt Seal Comparison
                </strong>
                {workbenchForm.expectedSeal && workbenchForm.physicalSeal && (
                  <span className={`badge ${workbenchForm.expectedSeal.trim().toUpperCase() === workbenchForm.physicalSeal.trim().toUpperCase() ? 'badge-green' : 'badge-red'}`}>
                    {workbenchForm.expectedSeal.trim().toUpperCase() === workbenchForm.physicalSeal.trim().toUpperCase() ? '✅ Seal Matched Manifest' : '⚠️ Seal Mismatch Alert!'}
                  </span>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Expected Manifest Seal #:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={workbenchForm.expectedSeal}
                    onChange={(e) => setWorkbenchForm({ ...workbenchForm, expectedSeal: e.target.value })}
                    style={{ background: '#f1f5f9', fontWeight: 700 }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Physical Seal Number Read on Container:</label>
                  <input
                    type="text"
                    className="input-control"
                    value={workbenchForm.physicalSeal}
                    onChange={(e) => setWorkbenchForm({ ...workbenchForm, physicalSeal: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '4px' }}>Reefer Temperature (°C):</label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-control"
                    placeholder="e.g. -18.5"
                    value={workbenchForm.temperatureRecorded}
                    onChange={(e) => setWorkbenchForm({ ...workbenchForm, temperatureRecorded: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Step 2: 7-Point Checklist Items */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '12px' }}>
                Step 2: 7-Point Container Physical & Structural Inspection Checklist
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {workbenchForm.checklist.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      background: item.status === 'Pass' ? '#f0fdf4' : item.status === 'Fail' ? '#fef2f2' : '#f8fafc',
                      border: `1px solid ${item.status === 'Pass' ? '#bbf7d0' : item.status === 'Fail' ? '#fca5a5' : '#e2e8f0'}`,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{item.item}</strong>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{item.comments}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '6px' }}>
                      {['Pass', 'Fail', 'N/A'].map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => handleToggleChecklist(idx, st)}
                          style={{
                            padding: '4px 12px',
                            borderRadius: '6px',
                            border: '1px solid',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            background: item.status === st ? (st === 'Pass' ? '#10b981' : st === 'Fail' ? '#ef4444' : '#64748b') : '#ffffff',
                            color: item.status === st ? '#ffffff' : '#334155',
                            borderColor: item.status === st ? 'transparent' : '#cbd5e1'
                          }}
                        >
                          {st === 'Pass' ? '✔ Pass' : st === 'Fail' ? '✖ Fail' : '○ N/A'}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step 3: Recommendation & Comments */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '22px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Overall Inspection Result:</label>
                <select
                  className="select-control"
                  value={workbenchForm.overallResult}
                  onChange={(e) => setWorkbenchForm({ ...workbenchForm, overallResult: e.target.value })}
                >
                  <option value="Passed">Passed (Meets all safety & customs criteria)</option>
                  <option value="Failed">Failed (Critical structural defect or seal breach)</option>
                  <option value="On Hold">On Hold (Pending document clarification)</option>
                  <option value="Repair Required">Repair Required (Send to Container Repair Facility)</option>
                  <option value="Requires Re-inspection">Requires Re-inspection (Secondary review)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Officer Recommendation:</label>
                <input
                  type="text"
                  className="input-control"
                  value={workbenchForm.recommendation}
                  onChange={(e) => setWorkbenchForm({ ...workbenchForm, recommendation: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Inspector Detailed Notes & Observations:</label>
              <textarea
                className="input-control"
                rows={3}
                value={workbenchForm.notes}
                onChange={(e) => setWorkbenchForm({ ...workbenchForm, notes: e.target.value })}
                placeholder="Record all physical findings, weighbridge notes, and photo captions..."
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button type="button" onClick={() => setActiveTab('queue')} className="btn btn-secondary">Cancel</button>
              <button type="submit" disabled={actionLoading} className="btn btn-primary">
                {actionLoading ? 'Submitting...' : 'Submit Certified Inspection Report'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =========================================================
          TAB 3: FAILED INSPECTIONS & QUARANTINE HOLDS
         ========================================================= */}
      {activeTab === 'failed' && (
        <div>
          <div className="maritime-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#dc2626' }}>
                  Failed Inspections & Quarantine Holds ({failedInspections.length})
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Containers flagged for critical defects, seal tampering, or customs discrepancy. Loading blocked.
                </div>
              </div>
            </div>

            {failedInspections.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#10b981', fontWeight: 700 }}>
                ✅ Zero containers currently on Quarantine Hold. All inspected shipments passed.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {failedInspections.map((ins) => (
                  <div
                    key={ins.inspectionId}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '10px',
                      background: '#fef2f2',
                      border: '1px solid #f87171',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <AlertTriangle size={18} color="#dc2626" />
                        <strong style={{ fontSize: '15px', color: '#991b1b' }}>{ins.containerId}</strong>
                        <span className="badge badge-red">{ins.result}</span>
                        <span style={{ fontSize: '11px', color: '#7f1d1d' }}>&bull; {ins.inspectionType}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#450a0a', marginTop: '4px' }}>
                        Recommendation: <strong>{ins.recommendation || 'Hold in quarantine'}</strong>
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f1d1d', marginTop: '2px' }}>
                        Notes: {ins.notes || 'Structural or seal defect recorded.'}
                      </div>
                      <div style={{ fontSize: '11px', color: '#991b1b', marginTop: '4px' }}>
                        Inspected by <strong>{ins.inspectorName}</strong> at {ins.port} on {new Date(ins.createdAt).toLocaleString()}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => {
                          setReinspectionModalItem(ins);
                          setReinspectionForm({
                            reason: `Re-inspect container following failure: ${ins.notes || 'Defect correction'}`,
                            priority: 'High',
                            deadlineHours: 24,
                            notes: ''
                          });
                        }}
                        className="btn btn-secondary btn-sm"
                      >
                        <RotateCcw size={13} />
                        <span>Schedule Re-Check</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 4: RE-INSPECTION & REPAIR REQUESTS
         ========================================================= */}
      {activeTab === 'reinspection' && (
        <div>
          <div className="maritime-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Re-Inspection & Repair Maintenance Queue
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Track containers requiring secondary structural verification, patch repair, or re-sealing
                </div>
              </div>
            </div>

            {reinspectionList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                No active re-inspection requests currently pending.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {reinspectionList.map((r) => (
                  <div
                    key={r.inspectionId}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '8px',
                      background: '#faf5ff',
                      border: '1px solid #e9d5ff',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RotateCcw size={16} color="#7c3aed" />
                        <strong style={{ fontSize: '14px', color: '#581c87' }}>{r.containerId}</strong>
                        <span className="badge badge-purple">{r.status || 'Re-inspection Required'}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#6b21a8', marginTop: '4px' }}>
                        Required action: {r.recommendation || r.notes}
                      </div>
                      <div style={{ fontSize: '11px', color: '#7c3aed', marginTop: '2px' }}>
                        Assigned Station: {r.port} &bull; Inspection ID: {r.inspectionId}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const target = containers.find(c => c.containerId === r.containerId) || { containerId: r.containerId };
                        handleSelectForWorkbench(target);
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <ClipboardCheck size={13} />
                      <span>Perform Re-Check Now</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          TAB 5: CERTIFIED PHOTO EVIDENCE VAULT
         ========================================================= */}
      {activeTab === 'evidence' && (
        <div>
          <div className="maritime-card" style={{ padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                  Certified Inspection Photo Evidence & Cryptographic Hashes
                </h3>
                <div style={{ fontSize: '12px', color: '#64748b' }}>
                  Photographs sealed with SHA-256 hash, Inspector identity, timestamp, and GPS coordinates
                </div>
              </div>
              <button onClick={() => setPhotoUploadModalOpen(true)} className="btn btn-primary btn-sm">
                <Camera size={14} />
                <span>Upload Proof Photo</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {evidenceList.map((ev) => (
                <div
                  key={ev.evidenceId}
                  style={{
                    padding: '14px',
                    borderRadius: '10px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '10px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span className="badge badge-cyan">{ev.category}</span>
                      <span style={{ fontSize: '10px', color: '#64748b' }}>{new Date(ev.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <strong style={{ fontSize: '13px', color: '#0f172a' }}>{ev.fileName}</strong>
                    <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                      Container: <strong style={{ color: '#0284c7' }}>{ev.containerId}</strong>
                    </div>
                    <div style={{ fontSize: '11px', color: '#334155', marginTop: '4px' }}>
                      {ev.notes || 'Inspection proof photograph'}
                    </div>
                  </div>

                  <div style={{ paddingTop: '8px', borderTop: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10px', fontFamily: 'monospace', color: '#10b981', wordBreak: 'break-all' }}>
                      SHA-256: {ev.fileHashSha256 ? `${ev.fileHashSha256.substring(0, 24)}...` : 'HASH-SEALED'}
                    </div>
                    <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                      Inspector: {ev.uploadedBy} &bull; GPS: 18.94°N, 72.83°E
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          MODALS
         ========================================================= */}
      {/* 1. Hold Modal */}
      {holdModalContainer && (
        <div className="modal-overlay" onClick={() => setHoldModalContainer(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#dc2626' }}>Quarantine Hold: {holdModalContainer.containerId}</h3>
              <button onClick={() => setHoldModalContainer(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleHoldContainer} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Quarantine Reason:</label>
                <select
                  className="select-control"
                  value={holdForm.reason}
                  onChange={(e) => setHoldForm({ ...holdForm, reason: e.target.value })}
                >
                  <option value="Security bolt seal mismatch against manifest declaration">Security bolt seal mismatch against manifest declaration</option>
                  <option value="Severe structural deformation / false compartment check">Severe structural deformation / false compartment check</option>
                  <option value="Chemical leakage / dangerous goods label violation">Chemical leakage / dangerous goods label violation</option>
                  <option value="Reefer cold-chain temperature excursion">Reefer cold-chain temperature excursion</option>
                  <option value="Customs physical cargo search required">Customs physical cargo search required</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Officer Justification Notes:</label>
                <textarea
                  className="input-control"
                  rows={3}
                  value={holdForm.notes}
                  onChange={(e) => setHoldForm({ ...holdForm, notes: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setHoldModalContainer(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }}>
                  {actionLoading ? 'Locking...' : 'Lock in Quarantine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Re-inspection Modal */}
      {reinspectionModalItem && (
        <div className="modal-overlay" onClick={() => setReinspectionModalItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Schedule Re-Inspection</h3>
              <button onClick={() => setReinspectionModalItem(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleRequestReinspection} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Re-Inspection Reason:</label>
                <input
                  type="text"
                  className="input-control"
                  value={reinspectionForm.reason}
                  onChange={(e) => setReinspectionForm({ ...reinspectionForm, reason: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Priority Level:</label>
                  <select
                    className="select-control"
                    value={reinspectionForm.priority}
                    onChange={(e) => setReinspectionForm({ ...reinspectionForm, priority: e.target.value })}
                  >
                    <option value="High">High (Immediate prior to loading)</option>
                    <option value="Medium">Medium (Within 24 Hours)</option>
                    <option value="Routine">Routine</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Deadline (Hours):</label>
                  <input
                    type="number"
                    className="input-control"
                    value={reinspectionForm.deadlineHours}
                    onChange={(e) => setReinspectionForm({ ...reinspectionForm, deadlineHours: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setReinspectionModalItem(null)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Scheduling...' : 'Schedule Re-Check'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Photo Upload Modal */}
      {photoUploadModalOpen && (
        <div className="modal-overlay" onClick={() => setPhotoUploadModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Camera size={18} color="#0284c7" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Upload Inspection Photo Proof</h3>
              </div>
              <button onClick={() => setPhotoUploadModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>

            <form onSubmit={handleUploadPhoto} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Container ID:</label>
                <select
                  className="select-control"
                  value={photoForm.containerId}
                  onChange={(e) => setPhotoForm({ ...photoForm, containerId: e.target.value })}
                  required
                >
                  <option value="">-- Select Container --</option>
                  {containers.map(c => (
                    <option key={c.containerId} value={c.containerId}>
                      {c.containerId} &bull; {c.cargoDescription}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Photo Evidence Category:</label>
                <select
                  className="select-control"
                  value={photoForm.category}
                  onChange={(e) => setPhotoForm({ ...photoForm, category: e.target.value })}
                >
                  <option value="Seal Photo">Bolt Seal Inspection Proof</option>
                  <option value="Damage Photo">Structural Damage / Deformation Photo</option>
                  <option value="Customs Check">Customs Clearance Stamp / Document</option>
                  <option value="Reefer Temp">Cold-Chain Temperature Display Reading</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>File Name / Reference:</label>
                <input
                  type="text"
                  className="input-control"
                  value={photoForm.fileName}
                  onChange={(e) => setPhotoForm({ ...photoForm, fileName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, marginBottom: '4px' }}>Photo Caption & Findings:</label>
                <input
                  type="text"
                  className="input-control"
                  value={photoForm.caption}
                  onChange={(e) => setPhotoForm({ ...photoForm, caption: e.target.value })}
                  required
                />
              </div>

              <div style={{ fontSize: '11px', color: '#64748b' }}>
                Upon upload, this image will automatically be timestamped, geo-tagged at 18.94°N 72.83°E, stamped with your inspector identity, and sealed with a SHA-256 cryptographic hash.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setPhotoUploadModalOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={actionLoading} className="btn btn-primary">
                  {actionLoading ? 'Sealing...' : 'Upload & Seal Proof'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InspectorDashboard;
