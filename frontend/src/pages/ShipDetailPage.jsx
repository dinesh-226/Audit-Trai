import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Ship,
  ArrowLeft,
  Box,
  MapPin,
  Clock,
  ShieldCheck,
  Radio,
  Edit2,
  Navigation,
  CheckCircle,
  ExternalLink
} from 'lucide-react';

export const ShipDetailPage = ({ shipId, onBack, onSelectContainer, onOpenShipModal, onNavigate }) => {
  const { hasRole } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchShipDetails();
  }, [shipId]);

  const fetchShipDetails = async () => {
    setLoading(true);
    try {
      let targetId = shipId;
      if (!targetId) {
        const all = await api.ships.getAll();
        if (all?.length > 0) targetId = all[0].shipId;
      }
      if (targetId) {
        const res = await api.ships.getById(targetId);
        setData(res);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await api.ships.updateStatus(shipId, newStatus);
      await fetchShipDetails();
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '80px', color: 'var(--text-muted)' }}>
        Loading vessel manifest and telemetry...
      </div>
    );
  }

  if (!data?.ship) {
    return (
      <div className="page-wrapper" style={{ textAlign: 'center', padding: '80px' }}>
        <h3>Ship record not found</h3>
        <button onClick={onBack} className="btn btn-secondary" style={{ marginTop: '16px' }}>
          Back to Fleet
        </button>
      </div>
    );
  }

  const { ship, containers, activityLogs } = data;

  return (
    <div className="page-wrapper">
      {/* Top Navigation */}
      <button
        onClick={onBack}
        className="btn btn-outline btn-sm"
        style={{ marginBottom: '20px' }}
      >
        <ArrowLeft size={14} />
        <span>Back to Fleet List</span>
      </button>

      {/* Main Ship Header Card */}
      <div className="maritime-card-glow" style={{ padding: '28px', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px' }}>
              <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Ship size={24} color="var(--cyan)" />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {ship.name}
                </h1>
                <div style={{ fontSize: '12px', color: 'var(--cyan)', fontFamily: 'monospace', fontWeight: 600 }}>
                  {ship.imoNumber} &bull; Classification: {ship.type}
                </div>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '8px' }}>
              Flag State: <strong>{ship.flag || 'Panama'}</strong> &bull; Master: <strong>{ship.captain}</strong> &bull; Capacity: <strong>{ship.capacityTEU} TEU</strong>
            </div>
          </div>

          {/* Status Controls */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => onNavigate ? onNavigate('ship-timeline', ship.shipId) : null}
                className="btn btn-primary btn-sm"
                style={{ background: '#0f3460', borderColor: '#0f3460', fontWeight: 700 }}
              >
                <Clock size={14} />
                <span>Life-Cycle Timeline</span>
              </button>
              <span className={`badge ${ship.status === 'In Transit' ? 'badge-blue' : ship.status === 'Loading' ? 'badge-cyan' : 'badge-green'}`} style={{ fontSize: '13px', padding: '6px 14px' }}>
                {ship.status}
              </span>
            </div>

            {hasRole('admin', 'ship_manager', 'port_manager') && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <select
                  className="select-control"
                  style={{ width: 'auto', fontSize: '12px' }}
                  value={ship.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  disabled={updatingStatus}
                >
                  <option value="Docked">Status: Docked</option>
                  <option value="Loading">Status: Loading</option>
                  <option value="Ready to Depart">Status: Ready to Depart</option>
                  <option value="In Transit">Status: In Transit</option>
                  <option value="Arrived">Status: Arrived</option>
                  <option value="Unloading">Status: Unloading</option>
                  <option value="Under Inspection">Status: Under Inspection</option>
                  <option value="Maintenance">Status: Maintenance</option>
                </select>
                <button
                  onClick={() => onOpenShipModal(ship)}
                  className="btn btn-secondary btn-sm"
                >
                  <Edit2 size={14} />
                  <span>Edit Vessel</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Coordinates & Telemetry Box */}
        <div style={{
          marginTop: '24px',
          padding: '16px 20px',
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '16px'
        }}>
          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current Position</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {ship.currentLocation}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--cyan)', fontFamily: 'monospace' }}>
              {ship.coordinates?.lat}°N, {ship.coordinates?.lng}°E
            </div>
          </div>

          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>AIS Speed & Heading</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
              {ship.coordinates?.speedKnots || 0} Knots
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
              Course Heading: {ship.coordinates?.heading || 0}°
            </div>
          </div>

          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Voyage Route</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
              {ship.departurePort} ➔ {ship.arrivalPort}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Destination: {ship.destination}
            </div>
          </div>

          <div>
            <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cargo Manifest</span>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--cyan)', marginTop: '2px' }}>
              {containers.length} Containers Active
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Onboard vessel holds
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Containers Onboard & Ship Activity Log */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.2fr', gap: '24px' }}>
        {/* Left: Onboard Containers Table */}
        <div className="maritime-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Onboard Cargo Manifest ({containers.length})
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Containers currently assigned to this vessel
              </div>
            </div>
          </div>

          {containers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No containers currently loaded on this vessel.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="maritime-table">
                <thead>
                  <tr>
                    <th>Container ID</th>
                    <th>Cargo Description</th>
                    <th>Status</th>
                    <th>Risk</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {containers.map((c) => (
                    <tr key={c.containerId}>
                      <td>
                        <div style={{ fontWeight: 800, color: '#0f172a' }}>{c.containerId}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{c.type} &bull; {c.weightKg?.toLocaleString()} kg</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{c.cargoDescription}</div>
                      </td>
                      <td>
                        <span className="badge badge-cyan">{c.status}</span>
                      </td>
                      <td>
                        <span className={`badge ${c.riskLevel === 'Low' ? 'badge-green' : c.riskLevel === 'Medium' ? 'badge-amber' : 'badge-red'}`}>
                          {c.riskLevel}
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => onSelectContainer(c)}
                          className="btn btn-outline btn-sm"
                        >
                          <Box size={12} />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Voyage Activity Log */}
        <div className="maritime-card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                Ship Operational Log
              </h3>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                Voyage events and activity history
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {activityLogs.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '13px' }}>
                No recorded voyage activities yet.
              </div>
            ) : (
              activityLogs.map((log) => (
                <div
                  key={log.auditId}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--cyan)', fontWeight: 700 }}>
                      {log.auditId}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                    {log.action}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                    By {log.username} ({log.userRole}) at {log.location}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
