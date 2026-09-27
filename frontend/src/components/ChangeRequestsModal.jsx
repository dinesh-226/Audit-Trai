import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  ShieldAlert, 
  User, 
  FolderKanban, 
  AlertTriangle,
  FileCheck2,
  Filter,
  Sparkles
} from 'lucide-react';

export const ChangeRequestsModal = ({ onClose, onActionCompleted, projectId = 'all' }) => {
  const { user } = useAuth();
  const isAdminOrManager = ['admin', 'manager'].includes(user?.role);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [reviewComments, setReviewComments] = useState({});
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    loadChangeRequests();
  }, [projectId]);

  const loadChangeRequests = async () => {
    try {
      setLoading(true);
      const data = await api.changeRequests.getAll({ projectId: projectId !== 'all' ? projectId : undefined });
      setRequests(data);
    } catch (err) {
      console.error('Failed to load change requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, decision) => {
    try {
      setActionLoadingId(id);
      setFeedback({ type: '', message: '' });

      const comment = reviewComments[id] || (decision === 'APPROVED' ? 'Approved after executive review' : 'Rejected per governance policy');
      const res = await api.changeRequests.review(id, decision, comment);

      setFeedback({
        type: 'success',
        message: res.message || `Request ${decision.toLowerCase()} successfully!`
      });

      await loadChangeRequests();
      if (onActionCompleted) onActionCompleted();
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Review action failed'
      });
    } finally {
      setActionLoadingId(null);
    }
  };

  const filtered = requests.filter(r => {
    if (filterStatus === 'ALL') return true;
    return r.status === filterStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge-role" style={{ background: '#dcfce7', color: '#15803d' }}>Approved</span>;
      case 'REJECTED':
        return <span className="badge-role" style={{ background: '#fee2e2', color: '#b91c1c' }}>Rejected</span>;
      default:
        return <span className="badge-role" style={{ background: '#ffedd5', color: '#c2410c' }}>Pending Admin Review</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '850px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(234, 88, 12, 0.12)',
              color: '#ea580c',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Review Change Requests</h3>
              <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                Separation of Duties Ledger &bull; Sensitive Change Approval Queue
              </div>
            </div>
          </div>
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm" style={{ padding: '4px' }}>
            <X size={18} />
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{
          padding: '0.75rem 1.25rem',
          background: 'var(--bg-input)',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-subtle)' }}>Status Filter:</span>
            {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-outline'}`}
                style={{ fontSize: '0.725rem', padding: '2px 10px' }}
              >
                {st === 'ALL' ? `All (${requests.length})` : `${st} (${requests.filter(r => r.status === st).length})`}
              </button>
            ))}
          </div>

          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Logged In As: <strong>{user?.name}</strong> ({user?.role})
          </div>
        </div>

        {/* Feedback Message */}
        {feedback.message && (
          <div style={{
            margin: '0.75rem 1.25rem 0 1.25rem',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: feedback.type === 'success' ? 'var(--success-bg)' : 'var(--danger-bg)',
            color: feedback.type === 'success' ? '#15803d' : '#b91c1c'
          }}>
            {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Body / Request List */}
        <div className="modal-body" style={{ overflowY: 'auto', flex: 1, padding: '1.25rem' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              Loading change requests...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <FileCheck2 size={36} style={{ color: 'var(--text-subtle)', marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>No Change Requests Found</div>
              <div style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                {filterStatus === 'PENDING' ? 'All sensitive change requests have been reviewed.' : 'No change requests match this filter.'}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filtered.map((req) => {
                const isRequester = String(req.requestedBy?._id || req.requestedBy) === String(user?.id || user?._id);
                const isPending = req.status === 'PENDING';

                return (
                  <div
                    key={req._id}
                    style={{
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--bg-card)',
                      padding: '1.25rem',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    {/* Header Row */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: req.changeType === 'BUDGET_INCREASE' ? 'rgba(14, 165, 233, 0.12)' : 'rgba(147, 51, 234, 0.12)',
                            color: req.changeType === 'BUDGET_INCREASE' ? '#0284c7' : '#7e22ce'
                          }}>
                            {req.changeType.replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                            Project: {req.projectName}
                          </span>
                        </div>
                        <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '2px 0 0 0', color: 'var(--text-main)' }}>
                          {req.title}
                        </h4>
                      </div>
                      <div>
                        {getStatusBadge(req.status)}
                      </div>
                    </div>

                    {/* Diff Box */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto 1fr',
                      alignItems: 'center',
                      gap: '12px',
                      background: 'var(--bg-input)',
                      padding: '0.85rem 1rem',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '0.85rem',
                      border: '1px solid var(--border-subtle)'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.675rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase' }}>
                          Old / Current Value
                        </div>
                        <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-muted)', marginTop: '2px' }}>
                          {req.changeType === 'BUDGET_INCREASE' ? `₹${Number(req.oldValue || 0).toLocaleString()}` : String(req.oldValue)}
                        </div>
                      </div>

                      <div style={{ color: 'var(--text-muted)' }}>
                        <ArrowRight size={18} />
                      </div>

                      <div>
                        <div style={{ fontSize: '0.675rem', fontWeight: 700, color: '#ea580c', textTransform: 'uppercase' }}>
                          Requested New Value
                        </div>
                        <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#ea580c', marginTop: '2px' }}>
                          {req.changeType === 'BUDGET_INCREASE' ? `₹${Number(req.newValue || 0).toLocaleString()}` : String(req.newValue)}
                        </div>
                      </div>
                    </div>

                    {/* Requester & Justification Info */}
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '2px' }}>
                        Developer Justification:
                      </div>
                      <div style={{ fontStyle: 'italic', background: 'rgba(0,0,0,0.02)', padding: '6px 10px', borderRadius: '4px', borderLeft: '3px solid var(--primary)' }}>
                        "{req.reason}"
                      </div>
                    </div>

                    {/* Metadata Row */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      borderTop: '1px solid var(--border-subtle)',
                      paddingTop: '0.6rem',
                      flexWrap: 'wrap',
                      gap: '6px'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <User size={13} />
                        <span>Requested by: <strong>{req.requestedByName}</strong> ({req.requestedByEmail})</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Clock size={13} />
                        <span>{new Date(req.createdAt).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Review Info (If already finalized) */}
                    {!isPending && (
                      <div style={{
                        marginTop: '0.75rem',
                        padding: '0.6rem 0.85rem',
                        borderRadius: 'var(--radius-sm)',
                        background: req.status === 'APPROVED' ? '#f0fdf4' : '#fef2f2',
                        border: req.status === 'APPROVED' ? '1px solid #bbf7d0' : '1px solid #fecaca',
                        fontSize: '0.8rem'
                      }}>
                        <div style={{ fontWeight: 700, color: req.status === 'APPROVED' ? '#15803d' : '#b91c1c' }}>
                          {req.status === 'APPROVED' ? '✓ Approved' : '✗ Rejected'} by {req.reviewedByName || 'Administrator'} on {new Date(req.reviewedAt).toLocaleString()}
                        </div>
                        {req.reviewComment && (
                          <div style={{ color: 'var(--text-main)', marginTop: '2px' }}>
                            Approver Note: "{req.reviewComment}"
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action Controls for Admin/Manager */}
                    {isPending && isAdminOrManager && (
                      <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-subtle)' }}>
                        {isRequester ? (
                          <div style={{
                            padding: '0.6rem 0.85rem',
                            borderRadius: 'var(--radius-sm)',
                            background: 'rgba(234, 88, 12, 0.08)',
                            color: '#c2410c',
                            fontSize: '0.775rem',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <ShieldAlert size={16} />
                            <span><strong>Separation of Duties Active:</strong> You submitted this request yourself. Another administrator must review and approve it.</span>
                          </div>
                        ) : (
                          <div>
                            <div style={{ marginBottom: '6px' }}>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Add review justification notes (saved in audit log)..."
                                value={reviewComments[req._id] || ''}
                                onChange={(e) => setReviewComments({ ...reviewComments, [req._id]: e.target.value })}
                                style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                              />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                              <button
                                type="button"
                                disabled={actionLoadingId === req._id}
                                onClick={() => handleReview(req._id, 'REJECTED')}
                                className="btn btn-outline btn-sm"
                                style={{ color: '#b91c1c', borderColor: '#fca5a5' }}
                              >
                                <XCircle size={14} /> Reject Request
                              </button>
                              <button
                                type="button"
                                disabled={actionLoadingId === req._id}
                                onClick={() => handleReview(req._id, 'APPROVED')}
                                className="btn btn-primary btn-sm"
                                style={{ background: '#16a34a', borderColor: '#16a34a' }}
                              >
                                <CheckCircle2 size={14} /> Approve & Apply Change
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn btn-outline btn-sm">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
