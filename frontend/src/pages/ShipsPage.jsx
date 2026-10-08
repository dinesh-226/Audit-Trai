import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Ship,
  Plus,
  Search,
  Filter,
  Navigation,
  Anchor,
  Box,
  Radio,
  ExternalLink,
  Edit2,
  Clock
} from 'lucide-react';

export const ShipsPage = ({ onSelectShip, onOpenShipModal, onNavigate, refreshKey }) => {
  const { hasRole } = useAuth();
  const [ships, setShips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchShips();
  }, [statusFilter, refreshKey]);

  const fetchShips = async () => {
    setLoading(true);
    try {
      const params = {};
      if (statusFilter) params.status = statusFilter;
      if (search && search.trim()) params.search = search.trim();
      const data = await api.ships.getAll(params);
      setShips(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchShips();
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
  };

  return (
    <div className="page-wrapper">
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '4px' }}>
            FLEET
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
            Ships & Fleet
          </h1>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Monitor ships, routes, and containers onboard
          </div>
        </div>

        {hasRole('admin', 'ship_manager') && (
          <button
            onClick={() => onOpenShipModal(null)}
            className="btn btn-primary"
          >
            <Plus size={16} />
            <span>Add Ship</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="maritime-card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input
              type="text"
              className="input-control"
              placeholder="Search by vessel name (MSC Irina), IMO number, captain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div style={{ minWidth: '180px' }}>
            <select
              className="select-control"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Operational Statuses</option>
              <option value="Docked">Docked</option>
              <option value="Loading">Loading</option>
              <option value="Ready to Depart">Ready to Depart</option>
              <option value="In Transit">In Transit</option>
              <option value="Arrived">Arrived</option>
              <option value="Unloading">Unloading</option>
              <option value="Under Inspection">Under Inspection</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary">
            <Search size={14} />
            <span>Filter</span>
          </button>

          {(search || statusFilter) && (
            <button type="button" onClick={handleResetFilters} className="btn btn-outline" style={{ fontSize: '12px' }}>
              Reset
            </button>
          )}
        </form>
      </div>

      {/* Fleet Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          Loading maritime vessel fleet data...
        </div>
      ) : ships.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
          No ships matched the search criteria.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '20px' }}>
          {ships.map((ship) => (
            <div
              key={ship.shipId}
              className="maritime-card-glow"
              style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
            >
              <div>
                {/* Card Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                      {ship.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--cyan)', fontFamily: 'monospace', fontWeight: 600 }}>
                      {ship.imoNumber} &bull; Flag: {ship.flag || 'Panama'}
                    </div>
                  </div>
                  <span className={`badge ${ship.status === 'In Transit' ? 'badge-blue' : ship.status === 'Loading' ? 'badge-cyan' : 'badge-green'}`}>
                    {ship.status}
                  </span>
                </div>

                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                  {ship.type} &bull; Master: <strong>{ship.captain}</strong>
                </div>

                {/* Voyage Route */}
                <div style={{
                  background: 'var(--bg-secondary)',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-color)',
                  marginBottom: '16px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: 700 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{ship.departurePort}</span>
                    <span style={{ color: 'var(--cyan)' }}>➔</span>
                    <span style={{ color: 'var(--text-primary)' }}>{ship.arrivalPort}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Current Location: <strong style={{ color: 'var(--text-secondary)' }}>{ship.currentLocation}</strong>
                  </div>
                </div>

                {/* Capacity & Telemetry Progress */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '12px', marginBottom: '14px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>Cargo Load</span>
                    <div style={{ fontWeight: 700, color: '#0f172a' }}>
                      {ship.containersOnboardCount || 0} <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>/ {ship.capacityTEU} TEU</span>
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '10px', textTransform: 'uppercase' }}>AIS Speed</span>
                    <div style={{ fontWeight: 700, color: '#10b981' }}>
                      {ship.coordinates?.speedKnots || 0} kts ({ship.coordinates?.heading || 0}°)
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div style={{ display: 'flex', gap: '8px', paddingTop: '14px', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => onSelectShip(ship)}
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                >
                  <Ship size={14} />
                  <span>Manifest</span>
                </button>
                <button
                  onClick={() => onNavigate ? onNavigate('ship-timeline', ship.shipId) : onSelectShip(ship)}
                  className="btn btn-secondary btn-sm"
                  style={{ fontWeight: 700, color: '#0f3460' }}
                  title="View Chronological Milestone Timeline"
                >
                  <Clock size={14} />
                  <span>Timeline</span>
                </button>
                {hasRole('admin', 'ship_manager') && (
                  <button
                    onClick={() => onOpenShipModal(ship)}
                    className="btn btn-secondary btn-sm"
                  >
                    <Edit2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
