import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Ship, Anchor, MapPin, Navigation } from 'lucide-react';

export const ShipModal = ({ ship, onClose, onSaved }) => {
  const [position, setPosition] = useState({ lat: '', lng: '' });
  const [formData, setFormData] = useState({
    name: '',
    imoNumber: '',
    type: 'Container Carrier',
    capacityTEU: 18000,
    departurePort: 'Singapore Port',
    arrivalPort: 'Mumbai Port',
    currentLocation: 'Singapore Berth 1',
    captain: 'Capt. Vikram Sengupta',
    flag: 'Panama',
    status: 'Docked'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setPosition({
      lat: ship?.coordinates?.lat != null ? String(ship.coordinates.lat) : '',
      lng: ship?.coordinates?.lng != null ? String(ship.coordinates.lng) : ''
    });
    if (ship) {
      setFormData({
        name: ship.name || '',
        imoNumber: ship.imoNumber || '',
        type: ship.type || 'Container Carrier',
        capacityTEU: ship.capacityTEU || 18000,
        departurePort: ship.departurePort || 'Singapore Port',
        arrivalPort: ship.arrivalPort || 'Mumbai Port',
        currentLocation: ship.currentLocation || 'Port Berth 1',
        captain: ship.captain || '',
        flag: ship.flag || 'Panama',
        status: ship.status || 'Docked'
      });
    }
  }, [ship]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const hasLatitude = position.lat.trim() !== '';
    const hasLongitude = position.lng.trim() !== '';
    if (hasLatitude !== hasLongitude) {
      setError('Enter both latitude and longitude, or leave both blank.');
      return;
    }
    if (hasLatitude) {
      const latitude = Number(position.lat);
      const longitude = Number(position.lng);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
          !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        setError('Enter a valid GPS latitude (-90 to 90) and longitude (-180 to 180).');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const payload = hasLatitude
        ? { ...formData, coordinates: { lat: Number(position.lat), lng: Number(position.lng) } }
        : formData;
      if (ship) {
        await api.ships.update(ship.shipId, payload);
      } else {
        await api.ships.create(payload);
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save ship');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'var(--primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Ship size={20} color="var(--cyan)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              {ship ? `Edit Vessel: ${ship.name}` : 'Register New Cargo Vessel'}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {error && (
            <div style={{ background: 'var(--danger-light)', color: 'var(--danger)', padding: '10px 14px', borderRadius: '6px', fontSize: '12px' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Ship Name *
              </label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. MV Ocean Star"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                IMO Number *
              </label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.imoNumber}
                onChange={(e) => setFormData({ ...formData, imoNumber: e.target.value })}
                placeholder="e.g. IMO 9811000"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Vessel Classification
              </label>
              <select
                className="select-control"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Container Carrier">Container Carrier</option>
                <option value="Ultra Large Container Vessel">Ultra Large Container Vessel (ULCV)</option>
                <option value="Panamax Container Ship">Panamax Container Ship</option>
                <option value="Feeder Container Ship">Feeder Container Ship</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                TEU Capacity *
              </label>
              <input
                type="number"
                required
                className="input-control"
                value={formData.capacityTEU}
                onChange={(e) => setFormData({ ...formData, capacityTEU: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Departure Port
              </label>
              <input
                type="text"
                className="input-control"
                value={formData.departurePort}
                onChange={(e) => setFormData({ ...formData, departurePort: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Arrival / Destination Port
              </label>
              <input
                type="text"
                className="input-control"
                value={formData.arrivalPort}
                onChange={(e) => setFormData({ ...formData, arrivalPort: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Captain / Master
              </label>
              <input
                type="text"
                className="input-control"
                value={formData.captain}
                onChange={(e) => setFormData({ ...formData, captain: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Operational Status
              </label>
              <select
                className="select-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Docked">Docked</option>
                <option value="Loading">Loading</option>
                <option value="Ready to Depart">Ready to Depart</option>
                <option value="In Transit">In Transit</option>
                <option value="Arrived">Arrived</option>
                <option value="Unloading">Unloading</option>
                <option value="Under Inspection">Under Inspection</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Vessel GPS Position (optional)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                className="input-control"
                aria-label="GPS latitude"
                placeholder="Latitude (-90 to 90)"
                value={position.lat}
                onChange={(e) => setPosition(current => ({ ...current, lat: e.target.value }))}
              />
              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                className="input-control"
                aria-label="GPS longitude"
                placeholder="Longitude (-180 to 180)"
                value={position.lng}
                onChange={(e) => setPosition(current => ({ ...current, lng: e.target.value }))}
              />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Only enter coordinates from a verified vessel position source.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Saving...' : (ship ? 'Update Vessel' : 'Register Vessel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
