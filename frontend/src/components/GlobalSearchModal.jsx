import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Search, X, Box, Ship, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';

export const GlobalSearchModal = ({ onClose, onSelectContainer, onSelectShip, onNavigateTab }) => {
  const [query, setQuery] = useState('');
  const [containers, setContainers] = useState([]);
  const [ships, setShips] = useState([]);
  const [audits, setAudits] = useState([]);
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setContainers([]);
      setShips([]);
      setAudits([]);
      setAnomalies([]);
      return;
    }

    const timer = setTimeout(() => {
      performSearch(query.trim());
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const performSearch = async (searchTerm) => {
    setLoading(true);
    try {
      const [cRes, sRes, aRes, anmRes] = await Promise.all([
        api.containers.getAll({ search: searchTerm }),
        api.ships.getAll({ search: searchTerm }),
        api.auditLogs.getAll({ search: searchTerm, limit: 5 }),
        api.anomalies.getAll({ entityId: searchTerm })
      ]);

      setContainers(cRes.slice(0, 4));
      setShips(sRes.slice(0, 3));
      setAudits(aRes.logs || []);
      setAnomalies(anmRes.slice(0, 3));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '650px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}
      >
        {/* Search Input Bar */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <Search size={20} color="var(--cyan)" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a Container ID (MSCU-7492014, ONEU-8821094), Ship (MSC Irina), Port, or Audit ID..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              color: '#f8fafc',
              fontSize: '15px',
              fontWeight: 600,
              outline: 'none'
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          )}
          <kbd style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            color: 'var(--text-muted)'
          }}>ESC</kbd>
        </div>

        {/* Results List */}
        <div style={{ maxHeight: '420px', overflowY: 'auto', padding: '16px 20px' }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
              Searching maritime ledger across all nodes...
            </div>
          )}

          {!loading && !query && (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Instant Maritime Ledger Search
              </div>
              <div style={{ fontSize: '12px' }}>
                Search by Container ID, Ship Name, IMO, Seal Number, or Audit Record ID.
              </div>
            </div>
          )}

          {!loading && query && containers.length === 0 && ships.length === 0 && audits.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
              No matches found for "<strong>{query}</strong>"
            </div>
          )}

          {/* Containers Matches */}
          {containers.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: '8px' }}>
                Containers ({containers.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {containers.map(c => (
                  <div
                    key={c.containerId}
                    onClick={() => {
                      if (onSelectContainer) onSelectContainer(c);
                      onClose();
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--cyan)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Box size={16} color="var(--cyan)" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#f8fafc' }}>
                          {c.containerId} &bull; <span style={{ color: 'var(--text-secondary)', fontWeight: 400 }}>{c.cargoDescription}</span>
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          Status: <strong>{c.status}</strong> &bull; Location: {c.currentLocation} &bull; Carrier: {c.assignedShipName || 'None'}
                        </div>
                      </div>
                    </div>
                    <span className={`badge ${c.riskLevel === 'Low' ? 'badge-green' : c.riskLevel === 'Medium' ? 'badge-amber' : 'badge-red'}`}>
                      {c.riskLevel}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ships Matches */}
          {ships.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', marginBottom: '8px' }}>
                Vessels & Ships ({ships.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {ships.map(s => (
                  <div
                    key={s.shipId}
                    onClick={() => {
                      if (onSelectShip) onSelectShip(s);
                      if (onNavigateTab) onNavigateTab('ships');
                      onClose();
                    }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = '#38bdf8'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Ship size={16} color="#38bdf8" />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '13px', color: '#f8fafc' }}>
                          {s.name} ({s.imoNumber})
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {s.departurePort} ➔ {s.arrivalPort} &bull; Captain: {s.captain}
                        </div>
                      </div>
                    </div>
                    <span className="badge badge-blue">{s.status}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Audit Trail Matches */}
          {audits.length > 0 && (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', textTransform: 'uppercase', marginBottom: '8px' }}>
                Audit Trail Blocks ({audits.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {audits.map(a => (
                  <div
                    key={a.auditId}
                    onClick={() => {
                      if (onNavigateTab) onNavigateTab('audit');
                      onClose();
                    }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: '6px',
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      fontSize: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}
                  >
                    <div>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan)', fontWeight: 700 }}>{a.auditId}</span>: <strong style={{ color: '#f8fafc' }}>{a.action}</strong> by {a.username}
                    </div>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                      {new Date(a.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
