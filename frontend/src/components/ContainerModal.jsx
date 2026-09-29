import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { X, Box, Shield, Tag, AlertTriangle, Snowflake } from 'lucide-react';

export const ContainerModal = ({ container, ships = [], onClose, onSaved }) => {
  const [formData, setFormData] = useState({
    containerId: '',
    type: 'Dry 40ft',
    size: '40ft',
    weightKg: 24000,
    cargoDescription: '',
    origin: 'Singapore Port',
    destination: 'Mumbai Port',
    currentLocation: 'Singapore Port Terminal 1',
    assignedShipId: '',
    ownerCompany: 'Apex Global Logistics',
    sealNumber: '',
    hazardClass: 'Non-Hazardous',
    temperatureCelsius: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (container) {
      setFormData({
        containerId: container.containerId || '',
        type: container.type || 'Dry 40ft',
        size: container.size || '40ft',
        weightKg: container.weightKg || 24000,
        cargoDescription: container.cargoDescription || '',
        origin: container.origin || 'Singapore Port',
        destination: container.destination || 'Mumbai Port',
        currentLocation: container.currentLocation || '',
        assignedShipId: container.assignedShipId || '',
        ownerCompany: container.ownerCompany || '',
        sealNumber: container.sealNumber || '',
        hazardClass: container.hazardClass || 'Non-Hazardous',
        temperatureCelsius: container.temperatureCelsius !== null && container.temperatureCelsius !== undefined ? container.temperatureCelsius : ''
      });
    } else {
      // Auto-generate realistic container code
      const prefixes = ['MSCU', 'CMAU', 'MAEU', 'HLCU', 'COSCO'];
      const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      setFormData(prev => ({
        ...prev,
        containerId: `${randomPrefix}-${randomNum}`,
        sealNumber: `SL-${Math.floor(100000 + Math.random() * 900000)}-SEC`
      }));
    }
  }, [container]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const payload = {
        ...formData,
        weightKg: Number(formData.weightKg),
        temperatureCelsius: formData.temperatureCelsius !== '' ? Number(formData.temperatureCelsius) : null,
        assignedShipId: formData.assignedShipId || null
      };

      if (container) {
        await api.containers.updateStatus(container.containerId, payload);
      } else {
        await api.containers.create(payload);
      }
      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save container');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
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
              <Box size={20} color="var(--cyan)" />
            </div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
              {container ? `Update Container: ${container.containerId}` : 'Book / Register New Shipping Container'}
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
                Container Identifier (ISO 6346) *
              </label>
              <input
                type="text"
                required
                disabled={!!container}
                className="input-control"
                value={formData.containerId}
                onChange={(e) => setFormData({ ...formData, containerId: e.target.value.toUpperCase() })}
                placeholder="e.g. MSCU-749201"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Owner / Carrier Line *
              </label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.ownerCompany}
                onChange={(e) => setFormData({ ...formData, ownerCompany: e.target.value })}
                placeholder="e.g. Maersk / MSC / CMA CGM"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Cargo Manifest Description *
            </label>
            <input
              type="text"
              required
              className="input-control"
              value={formData.cargoDescription}
              onChange={(e) => setFormData({ ...formData, cargoDescription: e.target.value })}
              placeholder="e.g. Temperature-Sensitive Vaccines & Pharmaceuticals"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Container Type
              </label>
              <select
                className="select-control"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                <option value="Dry 20ft">Dry 20ft</option>
                <option value="Dry 40ft">Dry 40ft</option>
                <option value="Reefer 40ft">Reefer 40ft (Cold Chain)</option>
                <option value="Tank 20ft">Tank 20ft (Liquids)</option>
                <option value="Open Top 40ft">Open Top 40ft</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Standard Size
              </label>
              <select
                className="select-control"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              >
                <option value="20ft">20ft</option>
                <option value="40ft">40ft</option>
                <option value="40ft High Cube">40ft High Cube</option>
                <option value="45ft High Cube">45ft High Cube</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Gross Weight (kg) *
              </label>
              <input
                type="number"
                required
                className="input-control"
                value={formData.weightKg}
                onChange={(e) => setFormData({ ...formData, weightKg: Number(e.target.value) })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Origin Port *
              </label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.origin}
                onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Destination Port *
              </label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.destination}
                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Assigned Carrier Vessel
              </label>
              <select
                className="select-control"
                value={formData.assignedShipId}
                onChange={(e) => setFormData({ ...formData, assignedShipId: e.target.value })}
              >
                <option value="">-- No Ship Assigned (Yard Staged) --</option>
                {ships.map((s) => (
                  <option key={s.shipId} value={s.shipId}>
                    {s.name} ({s.imoNumber}) &bull; {s.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Bolt Seal Number *
              </label>
              <input
                type="text"
                required
                className="input-control"
                value={formData.sealNumber}
                onChange={(e) => setFormData({ ...formData, sealNumber: e.target.value })}
                placeholder="e.g. SL-884920-SEC"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Hazard Classification
              </label>
              <select
                className="select-control"
                value={formData.hazardClass}
                onChange={(e) => setFormData({ ...formData, hazardClass: e.target.value })}
              >
                <option value="Non-Hazardous">Non-Hazardous</option>
                <option value="Class 3 - Flammable Liquids">Class 3 - Flammable Liquids</option>
                <option value="Class 6 - Toxic Substances">Class 6 - Toxic Substances</option>
                <option value="Class 8 - Corrosive Substances">Class 8 - Corrosive Substances</option>
                <option value="Class 9 - Miscellaneous Hazardous">Class 9 - Miscellaneous Hazardous</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Reefer Temperature (°C)
              </label>
              <input
                type="number"
                step="0.1"
                className="input-control"
                value={formData.temperatureCelsius}
                onChange={(e) => setFormData({ ...formData, temperatureCelsius: e.target.value })}
                placeholder="e.g. -18.5 (Leave blank if dry)"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn btn-primary">
              {loading ? 'Registering...' : (container ? 'Update Container' : 'Book Container & Generate Block')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
