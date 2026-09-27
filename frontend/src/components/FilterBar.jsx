import React from 'react';
import { Search, Filter, RotateCcw, Calendar, User, Tag, Layers, AlertTriangle, ShieldCheck } from 'lucide-react';

export const FilterBar = ({
  filters,
  onChange,
  onReset,
  onApply,
  users = [],
  projects = [],
  showProjectSelector = true
}) => {
  const setQuickDate = (days) => {
    if (days === 'all') {
      onChange({ ...filters, from: '', to: '' });
      return;
    }
    const to = new Date().toISOString().split('T')[0];
    const fromDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const from = fromDate.toISOString().split('T')[0];
    onChange({ ...filters, from, to });
  };

  return (
    <div className="filter-bar-container">
      {/* Search and Quick Presets (Section 1B) */}
      <div className="filter-row" style={{ justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: 2, minWidth: '260px' }}>
          <Search 
            size={16} 
            style={{ 
              position: 'absolute', 
              left: '12px', 
              top: '50%', 
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)' 
            }} 
          />
          <input
            type="text"
            placeholder="Search by user name, email, entity ID, or keyword..."
            className="form-control"
            style={{ paddingLeft: '36px' }}
            value={filters.search || ''}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && onApply()}
          />
        </div>

        {/* Quick Date Presets */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600 }}>PRESETS:</span>
          <button 
            type="button" 
            className="btn btn-outline btn-sm" 
            onClick={() => setQuickDate(0)}
          >
            Today
          </button>
          <button 
            type="button" 
            className="btn btn-outline btn-sm" 
            onClick={() => setQuickDate(7)}
          >
            Last 7 Days
          </button>
          <button 
            type="button" 
            className="btn btn-outline btn-sm" 
            onClick={() => setQuickDate(30)}
          >
            Last 30 Days
          </button>
          <button 
            type="button" 
            className="btn btn-outline btn-sm" 
            onClick={() => setQuickDate(90)}
          >
            Quarter to Date
          </button>
          <button 
            type="button" 
            className="btn btn-outline btn-sm" 
            onClick={() => setQuickDate('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Structured Multi-Facet Filter Row */}
      <div className="filter-row">
        {/* Project Selector if enabled */}
        {showProjectSelector && (
          <div className="filter-input-group">
            <label className="filter-label">Project Scope</label>
            <select
              className="form-control"
              value={filters.projectId || 'all'}
              onChange={(e) => onChange({ ...filters, projectId: e.target.value })}
            >
              <option value="all">All Organization Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name} ({p.code})</option>
              ))}
            </select>
          </div>
        )}

        {/* User / Actor Filter */}
        <div className="filter-input-group">
          <label className="filter-label">User / Actor</label>
          <select
            className="form-control"
            value={filters.userId || 'all'}
            onChange={(e) => onChange({ ...filters, userId: e.target.value })}
          >
            <option value="all">All Users & Roles</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
            ))}
          </select>
        </div>

        {/* Action Category */}
        <div className="filter-input-group">
          <label className="filter-label">Action Category</label>
          <select
            className="form-control"
            value={filters.action || 'all'}
            onChange={(e) => onChange({ ...filters, action: e.target.value })}
          >
            <option value="all">All Actions</option>
            <option value="CREATE">CREATE (Record Creation)</option>
            <option value="UPDATE">UPDATE (State Modification)</option>
            <option value="DELETE">DELETE (Removal)</option>
            <option value="APPROVE">APPROVE (Signoff Gate)</option>
            <option value="REJECT">REJECT (Declined)</option>
          </select>
        </div>

        {/* Target Entity */}
        <div className="filter-input-group">
          <label className="filter-label">Target Entity</label>
          <select
            className="form-control"
            value={filters.entityType || 'all'}
            onChange={(e) => onChange({ ...filters, entityType: e.target.value })}
          >
            <option value="all">All Entities</option>
            <option value="Project">Project Record</option>
            <option value="Budget">Budget Allocation</option>
            <option value="Task">Task Item</option>
            <option value="Document">Compliance Document</option>
            <option value="Approval">Approval Gate</option>
            <option value="Member">User Access / Team</option>
          </select>
        </div>

        {/* Date From */}
        <div className="filter-input-group" style={{ minWidth: '130px' }}>
          <label className="filter-label">From Date (UTC)</label>
          <input
            type="date"
            className="form-control"
            value={filters.from || ''}
            onChange={(e) => onChange({ ...filters, from: e.target.value })}
          />
        </div>

        {/* Date To */}
        <div className="filter-input-group" style={{ minWidth: '130px' }}>
          <label className="filter-label">To Date (UTC)</label>
          <input
            type="date"
            className="form-control"
            value={filters.to || ''}
            onChange={(e) => onChange({ ...filters, to: e.target.value })}
          />
        </div>

        {/* Execution Outcome Filter */}
        <div className="filter-input-group" style={{ minWidth: '140px' }}>
          <label className="filter-label">Execution Outcome</label>
          <select
            className="form-control"
            value={filters.isRisky ? 'risky' : 'all'}
            onChange={(e) => onChange({ ...filters, isRisky: e.target.value === 'risky' })}
          >
            <option value="all">All Outcomes</option>
            <option value="success">Success Only</option>
            <option value="risky">⚠️ High-Risk Flagged</option>
          </select>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', paddingTop: '18px', marginLeft: 'auto' }}>
          <button 
            type="button" 
            onClick={onApply} 
            className="btn btn-primary btn-sm"
          >
            <Filter size={14} />
            <span>Apply Filters</span>
          </button>
          <button 
            type="button" 
            onClick={onReset} 
            className="btn btn-outline btn-sm" 
            title="Reset Filters"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
};
