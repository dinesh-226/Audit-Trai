import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import {
  X,
  Search,
  Download,
  Box,
  Ship,
  FileCheck,
  ShieldCheck,
  ArrowUpRight,
  Clock
} from 'lucide-react';

export const DrillDownModal = ({
  isOpen,
  onClose,
  title,
  type = 'containers', // 'containers', 'ships', 'inspections', 'audit-logs'
  filterKey,
  filterValue,
  onNavigateItem
}) => {
  const [data, setData] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadDrilldownData();
    }
  }, [isOpen, type, filterKey, filterValue, page]);

  const loadDrilldownData = async () => {
    setLoading(true);
    try {
      const res = await api.analytics.getDrilldown({
        type,
        filterKey,
        filterValue,
        page,
        limit: 10
      });
      setData(res.records || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error('Failed to load drilldown records:', e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredRecords = data.filter(item => {
    if (!search) return true;
    const str = JSON.stringify(item).toLowerCase();
    return str.includes(search.toLowerCase());
  });

  const handleExportCsv = () => {
    if (data.length === 0) return;
    const keys = Object.keys(data[0]).filter(k => typeof data[0][k] !== 'object');
    const csvRows = [
      keys.join(','),
      ...data.map(row => keys.map(k => `"${String(row[k] || '').replace(/"/g, '""')}"`).join(','))
    ];
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `drilldown-${type}-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '820px', width: '90%' }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '1px' }}>
              ANALYTICS DRILL-DOWN INSPECTION
            </div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              {title || `Granular Records: ${type}`}
            </h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Search & Export Toolbar */}
        <div style={{ padding: '16px 24px', background: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, background: '#ffffff', padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
            <Search size={16} color="#64748b" />
            <input
              type="text"
              placeholder="Search in drilldown results..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ border: 'none', outline: 'none', width: '100%', fontSize: '13px' }}
            />
          </div>
          <button onClick={handleExportCsv} className="btn btn-secondary btn-sm" style={{ fontWeight: 700 }}>
            <Download size={13} />
            <span>Export CSV</span>
          </button>
        </div>

        {/* Content Table */}
        <div style={{ padding: '20px 24px', maxHeight: '420px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              <div className="spinner" style={{ width: '24px', height: '24px', margin: '0 auto 10px' }}></div>
              Loading drilldown records...
            </div>
          ) : filteredRecords.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No matching records found for this filter.
            </div>
          ) : (
            <table className="table" style={{ width: '100%', fontSize: '12px' }}>
              <thead>
                {type === 'containers' && (
                  <tr>
                    <th>Container ID</th>
                    <th>Seal #</th>
                    <th>Cargo</th>
                    <th>Status</th>
                    <th>Risk</th>
                    <th>Location</th>
                  </tr>
                )}
                {type === 'ships' && (
                  <tr>
                    <th>Vessel Name</th>
                    <th>IMO Number</th>
                    <th>Captain</th>
                    <th>Port</th>
                    <th>Status</th>
                  </tr>
                )}
                {type === 'inspections' && (
                  <tr>
                    <th>Inspection ID</th>
                    <th>Container</th>
                    <th>Inspector</th>
                    <th>Result</th>
                    <th>Date</th>
                  </tr>
                )}
                {type === 'audit-logs' && (
                  <tr>
                    <th>Audit ID</th>
                    <th>Action</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Time</th>
                  </tr>
                )}
              </thead>
              <tbody>
                {filteredRecords.map((item, idx) => (
                  <tr key={item._id || item.containerId || item.shipId || item.inspectionId || item.auditId || idx}>
                    {type === 'containers' && (
                      <>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>{item.containerId}</td>
                        <td style={{ fontFamily: 'monospace', color: '#0369a1' }}>{item.sealNumber || item.boltSealId || 'N/A'}</td>
                        <td>{item.cargoDescription || 'Freight'}</td>
                        <td><span className="badge badge-primary">{item.status}</span></td>
                        <td><span className={`badge ${item.riskLevel === 'Low' ? 'badge-green' : 'badge-red'}`}>{item.riskLevel}</span></td>
                        <td>{item.currentLocation || 'Port'}</td>
                      </>
                    )}
                    {type === 'ships' && (
                      <>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>{item.name}</td>
                        <td style={{ fontFamily: 'monospace' }}>{item.imoNumber}</td>
                        <td>{item.captain}</td>
                        <td>{item.currentPort}</td>
                        <td><span className="badge badge-green">{item.status}</span></td>
                      </>
                    )}
                    {type === 'inspections' && (
                      <>
                        <td style={{ fontWeight: 800, color: '#0f172a' }}>{item.inspectionId}</td>
                        <td style={{ color: '#0284c7', fontWeight: 700 }}>{item.containerId}</td>
                        <td>{item.inspectorName}</td>
                        <td><span className={`badge ${item.result === 'Passed' ? 'badge-green' : 'badge-red'}`}>{item.result}</span></td>
                        <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                      </>
                    )}
                    {type === 'audit-logs' && (
                      <>
                        <td style={{ fontFamily: 'monospace', color: '#0284c7' }}>{item.auditId}</td>
                        <td style={{ fontWeight: 700 }}>{item.action}</td>
                        <td>{item.username}</td>
                        <td><span className="badge badge-secondary">{item.userRole}</span></td>
                        <td>{new Date(item.timestamp).toLocaleTimeString()}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            Showing {filteredRecords.length} of {total} records
          </span>
          <button onClick={onClose} className="btn btn-primary" style={{ background: '#0f3460' }}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default DrillDownModal;
