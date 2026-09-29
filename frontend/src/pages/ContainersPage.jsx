import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Box,
  Plus,
  Search,
  Filter,
  QrCode,
  Clock,
  Shield,
  AlertTriangle,
  Ship,
  ExternalLink,
  Edit2,
  CheckCircle,
  Layers,
  X
} from 'lucide-react';

export const ContainersPage = ({ onSelectContainer, onOpenTimeline, onOpenQr, onOpenContainerModal }) => {
  const { hasRole } = useAuth();
  const [containers, setContainers] = useState([]);
  const [ships, setShips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  const [selectedForTransition, setSelectedForTransition] = useState(null);
  const [transitionStatus, setTransitionStatus] = useState('In Transit');
  const [transitionNotes, setTransitionNotes] = useState('');
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    fetchContainers();
    fetchShips();
  }, [statusFilter, riskFilter]);

  const fetchContainers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (riskFilter) params.riskLevel = riskFilter;
      if (search && search.trim()) params.search = search.trim();
      const data = await api.containers.getAll(params);
      setContainers(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchShips = async () => {
    try {
      const data = await api.ships.getAll();
      setShips(data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchContainers();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setRiskFilter('');
  };

  const handleExecuteStatusTransition = async () => {
    if (!selectedForTransition) return;
    setTransitioning(true);
    try {
      await api.containers.updateStatus(selectedForTransition.containerId, {
        status: transitionStatus,
        notes: transitionNotes || `Status updated to ${transitionStatus}`
      });
      setSelectedForTransition(null);
      setTransitionNotes('');
      await fetchContainers();
    } catch (e) {
      alert(`Error updating status: ${e.message}`);
    } finally {
      setTransitioning(false);
    }
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            CONTAINER CARGO MANAGEMENT
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Global Container Inventory & QR Pass
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Track container milestones, risk classifications, security seals, and status transitions
          </div>
        </div>

        {hasRole('admin', 'port_manager', 'ship_manager') && (
          <button
            onClick={() => onOpenContainerModal(null)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Book / Register Container</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="maritime-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Search by container ID (MSCU-7492014), cargo manifest, seal #, company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '160px' }}>
            <select
              className="select-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Booked">Booked</option>
              <option value="Ready for Loading">Ready for Loading</option>
              <option value="Loaded">Loaded</option>
              <option value="In Transit">In Transit</option>
              <option value="Arrived">Arrived</option>
              <option value="Unloading">Unloading</option>
              <option value="Under Inspection">Under Inspection</option>
              <option value="Delivered">Delivered</option>
              <option value="Delayed">Delayed</option>
              <option value="Flagged">Flagged</option>
            </select>
          </div>

          <div style={{ minWidth: '150px' }}>
            <select
              className="select-control"
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
            >
              <option value="">All Risk Levels</option>
              <option value="Low">Low Risk</option>
              <option value="Medium">Medium Risk</option>
              <option value="High">High Risk</option>
              <option value="Critical">Critical Risk</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            <Search size={14} />
            <span>Search</span>
          </button>

          {(search || statusFilter || riskFilter) && (
            <button type="button" onClick={handleResetFilters} className="btn btn-outline" style={{ fontSize: '12px' }}>
              Reset Filters
            </button>
          )}
        </form>
      </div>

      {/* Containers Table */}
      <div className="maritime-card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            Loading container inventory and tamper checks...
          </div>
        ) : containers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
            No containers found matching filter criteria.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="maritime-table">
              <thead>
                <tr>
                  <th>Container / Type</th>
                  <th>Cargo Description</th>
                  <th>Route / Location</th>
                  <th>Assigned Carrier</th>
                  <th>Status</th>
                  <th>Security Seal</th>
                  <th>Risk Score</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {containers.map((c) => (
                  <tr key={c.containerId}>
                    <td>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '14px' }}>
                        {c.containerId}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {c.type} &bull; {c.size} ({c.weightKg?.toLocaleString()} kg)
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>
                        {c.cargoDescription}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        Owner: <strong>{c.ownerCompany}</strong>
                        {c.hazardClass && c.hazardClass !== 'Non-Hazardous' && (
                          <span style={{ color: '#ef4444', marginLeft: '6px', fontWeight: 700 }}>
                            &bull; {c.hazardClass}
                          </span>
                        )}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '12px', fontWeight: 600 }}>
                        {c.origin} ➔ {c.destination}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--cyan)' }}>
                        {c.currentLocation}
                      </div>
                    </td>

                    <td>
                      {c.assignedShipName ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                          <Ship size={14} color="var(--cyan)" />
                          <span>{c.assignedShipName}</span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Yard Staged</span>
                      )}
                    </td>

                    <td>
                      <span className={`badge ${
                        c.status === 'In Transit' ? 'badge-blue' :
                        c.status === 'Delivered' ? 'badge-green' :
                        c.status === 'Under Inspection' ? 'badge-amber' :
                        c.status === 'Flagged' ? 'badge-red' : 'badge-cyan'
                      }`}>
                        {c.status}
                      </span>
                    </td>

                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#38bdf8', fontWeight: 600 }}>
                        {c.sealNumber}
                      </div>
                      {c.temperatureCelsius !== null && c.temperatureCelsius !== undefined && (
                        <div style={{ fontSize: '10px', color: c.temperatureCelsius > -10 ? '#ef4444' : '#10b981', fontWeight: 700 }}>
                          Temp: {c.temperatureCelsius}°C
                        </div>
                      )}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${c.riskLevel === 'Low' ? 'badge-green' : c.riskLevel === 'Medium' ? 'badge-amber' : 'badge-red'}`}>
                          {c.riskLevel} ({c.riskScore})
                        </span>
                      </div>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          onClick={() => onSelectContainer(c)}
                          title="Inspect 360° Profile"
                          className="btn btn-outline btn-sm"
                        >
                          <Box size={13} />
                          <span>Inspect</span>
                        </button>

                        <button
                          onClick={() => onOpenTimeline(c.containerId)}
                          title="Journey Timeline"
                          className="btn btn-secondary btn-sm"
                        >
                          <Clock size={13} />
                        </button>

                        <button
                          onClick={() => onOpenQr(c)}
                          title="Generate QR Pass"
                          className="btn btn-primary btn-sm"
                        >
                          <QrCode size={13} />
                        </button>

                        {hasRole('admin', 'port_manager', 'ship_manager', 'inspector') && (
                          <button
                            onClick={() => {
                              setSelectedForTransition(c);
                              setTransitionStatus(c.status);
                            }}
                            title="Transition Status"
                            className="btn btn-outline btn-sm"
                            style={{ color: 'var(--cyan)', borderColor: 'rgba(0, 180, 216, 0.4)' }}
                          >
                            Update
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Status Transition Modal */}
      {selectedForTransition && (
        <div className="modal-overlay" onClick={() => setSelectedForTransition(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Transition Status: {selectedForTransition.containerId}
              </h3>
              <button onClick={() => setSelectedForTransition(null)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Target Operational Status:
                </label>
                <select
                  className="select-control"
                  value={transitionStatus}
                  onChange={(e) => setTransitionStatus(e.target.value)}
                >
                  <option value="Booked">Booked</option>
                  <option value="Ready for Loading">Ready for Loading</option>
                  <option value="Loaded">Loaded (Onboard Ship)</option>
                  <option value="In Transit">In Transit (Sea Voyage)</option>
                  <option value="Arrived">Arrived at Port</option>
                  <option value="Unloading">Unloading at Quay</option>
                  <option value="Under Inspection">Under Inspection (Customs/Safety)</option>
                  <option value="Delivered">Delivered (Gate Out Signed)</option>
                  <option value="Delayed">Flag as Delayed</option>
                  <option value="Flagged">Flag for Security Quarantine</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Transition Notes & Operator Justification:
                </label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="e.g. Unloaded onto Mumbai Quay 3. Physical seal intact."
                  value={transitionNotes}
                  onChange={(e) => setTransitionNotes(e.target.value)}
                />
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                This operation will automatically write an immutable SHA-256 block into the cryptographic ledger and run the anomaly detection engine.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button onClick={() => setSelectedForTransition(null)} className="btn btn-secondary">
                  Cancel
                </button>
                <button onClick={handleExecuteStatusTransition} disabled={transitioning} className="btn btn-primary">
                  {transitioning ? 'Recording...' : 'Commit to Ledger'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
