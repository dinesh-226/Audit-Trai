import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { FilterBar } from '../components/FilterBar';
import { AuditTable } from '../components/AuditTable';
import { AuditTimeline } from '../components/AuditTimeline';
import { AuditEpisodes } from '../components/AuditEpisodes';
import { 
  FileSpreadsheet, 
  FileCheck2, 
  Table, 
  Clock, 
  Boxes, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  Download
} from 'lucide-react';

export const ProjectAuditPage = ({ 
  projectId = 'all', 
  projects = [], 
  onSelectProject, 
  onViewAuditorReport,
  onSelectLog 
}) => {
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'timeline' | 'episodes'
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({
    projectId: projectId,
    userId: 'all',
    action: 'all',
    entityType: 'all',
    from: '',
    to: '',
    isRisky: false,
    search: '',
    page: 1,
    limit: 25
  });

  useEffect(() => {
    setFilters(prev => ({ ...prev, projectId }));
  }, [projectId]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters.projectId, filters.page, filters.limit, filters.action, filters.entityType, filters.userId, filters.isRisky]);

  const loadUsers = async () => {
    try {
      const u = await api.auth.getUsers();
      setUsers(u);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.auditLogs.getAll(filters);
      setLogs(res.logs || []);
      setPagination(res.pagination || { page: 1, limit: 25, total: 0, totalPages: 1 });
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    fetchLogs();
  };

  const handleResetFilters = () => {
    const resetState = {
      projectId: projectId,
      userId: 'all',
      action: 'all',
      entityType: 'all',
      from: '',
      to: '',
      isRisky: false,
      search: '',
      page: 1,
      limit: 25
    };
    setFilters(resetState);
  };

  const handleExportCsv = () => {
    const url = api.auditLogs.getExportCsvUrl(filters);
    window.open(url, '_blank');
  };

  const activeProject = projects.find(p => p._id === projectId);
  const projectNameDisplay = activeProject ? activeProject.name : 'All Organization Projects';

  const startIndex = (pagination.page - 1) * pagination.limit + 1;
  const endIndex = Math.min(pagination.page * pagination.limit, pagination.total);

  return (
    <div className="fade-in">
      {/* Header (PDF Section 6.4.1) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '1.75rem' }}>Audit Trail — {projectNameDisplay}</h1>
            {activeProject && (
              <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}>
                {activeProject.code}
              </span>
            )}
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.2rem' }}>
            Comprehensive time-ordered ledger of all operational decisions, data changes, and approvals.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={handleExportCsv} className="btn btn-secondary btn-sm" title="Download CSV Report">
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button onClick={() => onViewAuditorReport(projectId)} className="btn btn-primary btn-sm">
            <FileCheck2 size={14} />
            <span>Auditor View & PDF</span>
          </button>
        </div>
      </div>

      {/* Filter Bar (PDF Section 6.4.2) */}
      <FilterBar
        filters={filters}
        onChange={setFilters}
        onReset={handleResetFilters}
        onApply={handleApplyFilters}
        users={users}
        projects={projects}
        showProjectSelector={projectId === 'all'}
      />

      {/* View Toggle Bar (PDF Section 6.4.3) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div className="segmented-control">
          <button
            className={`segmented-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Table size={14} /> Table View
            </span>
          </button>
          <button
            className={`segmented-btn ${viewMode === 'timeline' ? 'active' : ''}`}
            onClick={() => setViewMode('timeline')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={14} /> Timeline View
            </span>
          </button>
          <button
            className={`segmented-btn ${viewMode === 'episodes' ? 'active' : ''}`}
            onClick={() => setViewMode('episodes')}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Boxes size={14} /> Grouped Episodes
            </span>
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Found <strong style={{ color: 'var(--text-main)' }}>{pagination.total}</strong> recorded audit events
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'table' && (
        <AuditTable
          logs={logs}
          loading={loading}
          onSelectLog={onSelectLog}
        />
      )}

      {viewMode === 'timeline' && (
        <AuditTimeline
          logs={logs}
          onSelectLog={onSelectLog}
        />
      )}

      {viewMode === 'episodes' && (
        <AuditEpisodes
          projectId={projectId}
          onSelectLog={onSelectLog}
        />
      )}

      {/* Pagination Footer (PDF Section 6.4.6) */}
      {viewMode === 'table' && pagination.total > 0 && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginTop: '1.5rem',
          padding: '0.75rem 0'
        }}>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing <strong>{startIndex}–{endIndex}</strong> of <strong>{pagination.total}</strong> results
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              disabled={pagination.page <= 1}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
              className="btn btn-outline btn-sm"
            >
              <ChevronLeft size={14} />
              <span>Previous</span>
            </button>

            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 4px' }}>
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
              className="btn btn-outline btn-sm"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
