import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Boxes, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  User, 
  AlertTriangle, 
  Layers, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const AuditEpisodes = ({ projectId, onSelectLog }) => {
  const [episodes, setEpisodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    fetchEpisodes();
  }, [projectId]);

  const fetchEpisodes = async () => {
    try {
      setLoading(true);
      const data = await api.auditLogs.getEpisodes(projectId === 'all' ? null : projectId);
      setEpisodes(data);
      // Auto expand first episode
      if (data.length > 0) {
        setExpanded({ [data[0].episodeId]: true });
      }
    } catch (err) {
      console.error('Failed to load episodes:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (epId) => {
    setExpanded(prev => ({ ...prev, [epId]: !prev[epId] }));
  };

  if (loading) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Grouping Audit Episodes...</div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Aggregating session logs into holistic stories</div>
      </div>
    );
  }

  if (episodes.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
        <Boxes size={36} style={{ color: 'var(--text-subtle)', margin: '0 auto 1rem auto' }} />
        <h3 style={{ fontSize: '1.1rem' }}>No Grouped Episodes Found</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Audit events will automatically cluster into episodes as multiple actions occur.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="fade-in">
      <div style={{ 
        background: 'rgba(99, 102, 241, 0.1)', 
        border: '1px solid rgba(99, 102, 241, 0.25)', 
        borderRadius: 'var(--radius-md)', 
        padding: '0.85rem 1.25rem',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '0.85rem',
        color: 'var(--text-main)'
      }}>
        <Sparkles size={18} style={{ color: 'var(--primary)', flexShrink: 0 }} />
        <div>
          <strong>Episode Aggregator Mode:</strong> Instead of disconnected log rows, related actions are grouped into contextual change episodes to tell the complete operational story.
        </div>
      </div>

      {episodes.map((ep) => {
        const isExp = !!expanded[ep.episodeId];
        const startDate = new Date(ep.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

        return (
          <div key={ep.episodeId} className="card" style={{ borderLeft: ep.isRisky ? '4px solid var(--danger)' : '4px solid var(--primary)' }}>
            {/* Episode Header */}
            <div 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => toggleExpand(ep.episodeId)}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)' }}>{ep.title}</h3>
                  <span className="badge badge-create" style={{ fontSize: '0.7rem' }}>
                    {ep.eventCount} {ep.eventCount === 1 ? 'Action' : 'Actions'}
                  </span>
                  {ep.isRisky && (
                    <span className="badge badge-risky">
                      <AlertTriangle size={11} /> High Risk
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={13} /> {startDate}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <User size={13} /> Led by: {ep.primaryActor}
                  </span>
                  {ep.projectName && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Layers size={13} /> Project: {ep.projectName}
                    </span>
                  )}
                </div>
              </div>

              <button className="btn btn-outline btn-sm">
                {isExp ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                <span>{isExp ? 'Collapse Story' : 'Expand Story'}</span>
              </button>
            </div>

            {/* Expanded Episode Events */}
            {isExp && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {ep.events.map((ev, idx) => (
                  <div 
                    key={ev._id || idx}
                    onClick={() => onSelectLog(ev)}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: '0.85rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      cursor: 'pointer',
                      transition: 'var(--transition)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                    onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        background: 'rgba(99, 102, 241, 0.2)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.75rem',
                        fontWeight: 700
                      }}>
                        {idx + 1}
                      </span>

                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-main)' }}>
                          {ev.userName} ({ev.userRole}) {ev.action} {ev.entityType} "{ev.entityName}"
                        </div>
                        {ev.reason && (
                          <div style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                            Justification: "{ev.reason}"
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {ev.oldValue !== null && ev.newValue !== null && (
                        <div className="diff-container" style={{ fontSize: '0.75rem' }}>
                          <span className="diff-old">{String(ev.oldValue)}</span>
                          <ArrowRight size={11} className="diff-arrow" />
                          <span className="diff-new">{String(ev.newValue)}</span>
                        </div>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                        {new Date(ev.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
