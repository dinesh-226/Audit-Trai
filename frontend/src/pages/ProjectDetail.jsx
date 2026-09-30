import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  DollarSign, 
  CheckSquare, 
  Layers, 
  History, 
  Users, 
  Calendar, 
  Plus, 
  Edit3, 
  FileCheck2, 
  Trash2,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  FileText,
  Archive,
  UploadCloud,
  Send,
  MessageSquare,
  Paperclip,
  Download
} from 'lucide-react';
import { BudgetModal } from '../components/BudgetModal';
import { TaskModal } from '../components/TaskModal';
import { RequestChangeModal } from '../components/RequestChangeModal';
import { ProjectArchiveModal } from '../components/ProjectArchiveModal';
import { DocumentUploadModal } from '../components/DocumentUploadModal';
import { useAuth } from '../context/AuthContext';

export const ProjectDetail = ({ 
  projectId, 
  onBack, 
  onViewAuditTrail, 
  onViewAuditorReport,
  onSelectLog 
}) => {
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('overview'); // overview | tasks | documents | budget | audit
  const [taskFilter, setTaskFilter] = useState('all'); // all | my | Todo | In Progress | Done
  const [loading, setLoading] = useState(true);

  // Modals state
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showRequestChangeModal, setShowRequestChangeModal] = useState(false);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [showUploadDocModal, setShowUploadDocModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  // Quick Comment state
  const [commentTextMap, setCommentTextMap] = useState({});

  useEffect(() => {
    if (projectId) {
      loadProjectData();
    }
  }, [projectId]);

  const loadProjectData = async () => {
    try {
      setLoading(true);
      const [projData, tasksData, usersData, logsData] = await Promise.all([
        api.projects.getById(projectId),
        api.tasks.getAll(projectId),
        api.auth.getUsers(),
        api.auditLogs.getAll({ projectId, limit: 15, sortOrder: 'desc' })
      ]);
      setProject(projData);
      setTasks(tasksData);
      setUsers(usersData);
      setRecentLogs(logsData.logs || []);
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBudget = async (newAmount, reason) => {
    await api.projects.updateBudget(projectId, newAmount, reason);
    await loadProjectData();
  };

  const handleSaveTask = async (taskPayload) => {
    if (selectedTask) {
      await api.tasks.update(selectedTask._id, taskPayload);
    } else {
      await api.tasks.create(taskPayload);
    }
    await loadProjectData();
  };

  const handleDeleteTask = async (taskId, title) => {
    const reason = window.prompt(`Please provide a reason for deleting task "${title}":`, 'Task scope removed from project');
    if (reason !== null) {
      await api.tasks.delete(taskId, reason);
      await loadProjectData();
    }
  };

  const handleAddComment = async (taskId) => {
    const text = commentTextMap[taskId];
    if (!text || !text.trim()) return;

    try {
      await api.tasks.addComment(taskId, text.trim());
      setCommentTextMap({ ...commentTextMap, [taskId]: '' });
      await loadProjectData();
    } catch (err) {
      console.error('Failed to post comment:', err);
    }
  };

  if (loading || !project) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '4rem' }}>
        <div style={{ color: 'var(--primary)', fontWeight: 600 }}>Loading Project Details...</div>
      </div>
    );
  }

  const role = user?.role || 'member';
  const isAuditor = role === 'auditor';
  const isAdmin = role === 'admin';
  const isManagerOrAdmin = ['admin', 'manager'].includes(role);
  const isArchived = project.status === 'Archived';

  return (
    <div className="fade-in">
      {/* Role Banner if Auditor */}
      {isAuditor && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '0.75rem 1rem',
          marginBottom: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          color: '#b45309',
          fontSize: '0.85rem'
        }}>
          <ShieldCheck size={18} />
          <span>
            <strong>Compliance Auditor Inspection Mode:</strong> You are reviewing this project in read-only mode to maintain independent audit integrity.
          </span>
        </div>
      )}

      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <button 
            onClick={onBack} 
            className="btn btn-outline btn-sm" 
            style={{ marginBottom: '0.75rem', padding: '2px 8px' }}
          >
            ← Back to All Projects
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <h1 style={{ fontSize: '1.85rem', margin: 0 }}>{project.name}</h1>
            <span className="badge" style={{ background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
              {project.code}
            </span>
            <span className={`badge ${isArchived ? 'badge-delete' : 'badge-create'}`}>
              {project.status || 'Active'}
            </span>
          </div>

          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '0.35rem', marginBottom: 0 }}>
            {project.description}
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Developer Request Change button */}
          {!isAuditor && !isArchived && (
            <button
              onClick={() => setShowRequestChangeModal(true)}
              className="btn btn-outline btn-sm"
              style={{ borderColor: '#ea580c', color: '#ea580c', background: 'rgba(234, 88, 12, 0.05)' }}
            >
              <Send size={14} />
              <span>Request Sensitive Change</span>
            </button>
          )}

          {/* Upload Document button */}
          {!isAuditor && !isArchived && (
            <button onClick={() => setShowUploadDocModal(true)} className="btn btn-secondary btn-sm">
              <UploadCloud size={14} />
              <span>Upload Document</span>
            </button>
          )}

          {/* Admin Archive Project button (Instead of hard delete) */}
          {isAdmin && !isArchived && (
            <button 
              onClick={() => setShowArchiveModal(true)} 
              className="btn btn-outline btn-sm"
              style={{ borderColor: '#d97706', color: '#d97706' }}
            >
              <Archive size={14} />
              <span>Archive Project</span>
            </button>
          )}

          <button onClick={() => onViewAuditorReport(project._id)} className="btn btn-secondary btn-sm">
            <FileCheck2 size={14} />
            <span>Auditor Report</span>
          </button>

          <button onClick={() => onViewAuditTrail(project._id)} className="btn btn-primary btn-sm">
            <History size={14} />
            <span>Dedicated Audit Trail</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
        <button
          onClick={() => setActiveTab('overview')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Overview
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'tasks' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'tasks' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Tasks & Backlog ({tasks.length})
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'documents' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'documents' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Documents & Proofs ({project.documents?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('budget')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'budget' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'budget' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Budget (₹{(project.budget || 0).toLocaleString()})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          style={{
            padding: '0.75rem 1.25rem',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === 'audit' ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === 'audit' ? 'var(--primary)' : 'var(--text-muted)',
            fontWeight: 600,
            fontSize: '0.9rem',
            cursor: 'pointer'
          }}
        >
          Audit History Stream
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="card">
              <h3 style={{ fontSize: '1.15rem', marginBottom: '0.75rem' }}>Project Scope & Charter</h3>
              <p style={{ color: 'var(--text-main)', fontSize: '0.925rem', lineHeight: 1.6 }}>
                {project.description || 'No description entered.'}
              </p>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', 
                gap: '1rem',
                marginTop: '1.5rem',
                paddingTop: '1.25rem',
                borderTop: '1px solid var(--border-subtle)'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Category</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{project.category}</div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Created Date</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>
                    {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase' }}>Created By</div>
                  <div style={{ fontWeight: 600, marginTop: '2px' }}>{project.createdBy?.name || 'Administrator'}</div>
                </div>
              </div>
            </div>

            {/* Team Members */}
            <div className="card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Assigned Team Members</h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-subtle)' }}>
                  {project.members?.length || 0} developers & leads
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {project.members?.map((m) => (
                  <div key={m._id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '0.65rem 0.85rem',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}>
                    <div style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--primary-light)',
                      color: 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.8rem'
                    }}>
                      {m.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{m.name}</div>
                      <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {m.role} &bull; {m.department}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Metrics & Links */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div className="card">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', textTransform: 'uppercase', fontWeight: 600 }}>
                Budget Allocation
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
                ₹{(project.budget || 0).toLocaleString()}
              </div>

              {!isAuditor && (
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {isAdmin ? (
                    <button onClick={() => setShowBudgetModal(true)} className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
                      <Edit3 size={14} /> Direct Budget Adjustment
                    </button>
                  ) : (
                    <button onClick={() => setShowRequestChangeModal(true)} className="btn btn-primary btn-sm" style={{ width: '100%', justifyContent: 'center', background: '#ea580c', borderColor: '#ea580c' }}>
                      <Send size={14} /> Request Budget Increase
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="card">
              <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem' }}>Delivery Progress</h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Completed Tasks: <strong>{tasks.filter(t => t.status === 'Done').length}</strong> of <strong>{tasks.length}</strong>
              </div>
              <div style={{ height: 8, background: 'var(--bg-input)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  width: `${tasks.length > 0 ? (tasks.filter(t => t.status === 'Done').length / tasks.length) * 100 : 0}%`,
                  height: '100%',
                  background: 'var(--success)'
                }}></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TASKS & BACKLOG */}
      {activeTab === 'tasks' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {['all', 'Todo', 'In Progress', 'In Review', 'Done', 'Blocked'].map((st) => (
                <button
                  key={st}
                  onClick={() => setTaskFilter(st)}
                  className={`btn btn-sm ${taskFilter === st ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: '0.75rem', padding: '3px 8px' }}
                >
                  {st === 'all' ? `All Tasks (${tasks.length})` : `${st} (${tasks.filter(t => t.status === st).length})`}
                </button>
              ))}
            </div>

            {!isAuditor && !isArchived && (
              <button 
                onClick={() => {
                  setSelectedTask(null);
                  setShowTaskModal(true);
                }} 
                className="btn btn-primary btn-sm"
              >
                <Plus size={14} />
                <span>Create Task</span>
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {tasks
              .filter(t => taskFilter === 'all' || t.status === taskFilter)
              .map((t) => (
                <div key={t._id} className="card" style={{ padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span className={`badge ${t.status === 'Done' ? 'badge-create' : t.status === 'Blocked' ? 'badge-delete' : 'badge-update'}`}>
                          {t.status}
                        </span>
                        <span className="badge" style={{ background: '#f1f5f9', color: 'var(--text-muted)', fontSize: '0.675rem' }}>
                          {t.priority} Priority
                        </span>
                        <h4 style={{ fontSize: '1.05rem', margin: 0 }}>{t.title}</h4>
                      </div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '4px 0 0 0' }}>
                        {t.description || 'No description'}
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      {!isAuditor && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedTask(t);
                              setShowTaskModal(true);
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '4px 8px' }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteTask(t._id, t.title)}
                              className="btn btn-outline btn-sm"
                              style={{ padding: '4px 8px', color: '#dc2626', borderColor: '#fca5a5' }}
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Assignee & Meta */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-subtle)', paddingTop: '0.6rem', marginTop: '0.75rem' }}>
                    <div>
                      Assigned To: <strong>{t.assignedTo?.name || 'Unassigned'}</strong>
                    </div>
                    <div>
                      Created: {new Date(t.createdAt).toLocaleDateString()}
                    </div>
                  </div>

                  {/* Task Comments Section */}
                  <div style={{ marginTop: '0.75rem', background: 'var(--bg-input)', padding: '0.75rem', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-subtle)', textTransform: 'uppercase', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <MessageSquare size={13} /> Comments & Activity ({t.comments?.length || 0})
                    </div>

                    {t.comments?.map((c, i) => (
                      <div key={i} style={{ fontSize: '0.8rem', padding: '4px 0', borderBottom: i < t.comments.length - 1 ? '1px solid var(--border-subtle)' : 'none' }}>
                        <strong>{c.userName}:</strong> {c.text}
                        <span style={{ fontSize: '0.675rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                          {new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}

                    {!isAuditor && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="Add comment (logged in audit trail)..."
                          value={commentTextMap[t._id] || ''}
                          onChange={(e) => setCommentTextMap({ ...commentTextMap, [t._id]: e.target.value })}
                          style={{ fontSize: '0.775rem', padding: '4px 8px' }}
                          onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(t._id); }}
                        />
                        <button
                          type="button"
                          onClick={() => handleAddComment(t._id)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          Post
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* TAB 3: DOCUMENTS & PROOFS */}
      {activeTab === 'documents' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Project Documents & Compliance Proofs</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Attached technical specifications, SOC-2 verification files, and artifacts
              </div>
            </div>

            {!isAuditor && !isArchived && (
              <button onClick={() => setShowUploadDocModal(true)} className="btn btn-primary btn-sm">
                <UploadCloud size={14} />
                <span>Upload Document</span>
              </button>
            )}
          </div>

          {(!project.documents || project.documents.length === 0) ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <FileText size={36} style={{ color: 'var(--text-subtle)', marginBottom: '0.5rem' }} />
              <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>No Documents Attached</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Developers and administrators can attach specifications and compliance files here.
              </div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
              {project.documents.map((doc, idx) => (
                <div key={idx} className="card" style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(14, 165, 233, 0.1)',
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <FileText size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {doc.category || 'Specification'} &bull; {doc.size || '1.5 MB'}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)', marginTop: '4px' }}>
                        Uploaded by {doc.uploadedBy} on {new Date(doc.uploadedAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: BUDGET & FINANCIAL GOVERNANCE */}
      {activeTab === 'budget' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.2rem', marginBottom: '1rem' }}>Current Budget Allocation</h3>
            <div style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
              ₹{(project.budget || 0).toLocaleString()}
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              All budget increases or adjustments trigger an automated high-risk cryptographic audit ledger entry and require formal justification.
            </p>

            {!isAuditor && !isArchived && (
              <div style={{ marginTop: '1.5rem', display: 'flex', gap: '10px' }}>
                {isAdmin ? (
                  <button onClick={() => setShowBudgetModal(true)} className="btn btn-primary btn-sm">
                    <DollarSign size={14} /> Adjust Project Budget
                  </button>
                ) : (
                  <button onClick={() => setShowRequestChangeModal(true)} className="btn btn-primary btn-sm" style={{ background: '#ea580c', borderColor: '#ea580c' }}>
                    <Send size={14} /> Request Budget Increase
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="card" style={{ background: 'var(--bg-input)' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Separation of Duties Workflow</h4>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Developers cannot directly overwrite project budgets. When a developer submits a budget change request, it is queued for executive review. An administrator must independently review and approve it before the ledger applies the adjustment.
            </p>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT TRAIL STREAM */}
      {activeTab === 'audit' && (
        <div className="card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Project Audit Trail Ledger</h3>
            <button onClick={() => onViewAuditTrail(project._id)} className="btn btn-secondary btn-sm">
              Open Full Filterable Ledger
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentLogs.map((log) => (
              <div 
                key={log._id} 
                onClick={() => onSelectLog(log)}
                style={{
                  padding: '0.85rem 1rem',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-surface)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span className={`badge badge-${log.action?.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                      {log.action} {log.entityType}
                    </span>
                    <strong style={{ fontSize: '0.85rem' }}>{log.entityName || log.fieldName}</strong>
                  </div>
                  <div style={{ fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    By {log.userName} &bull; Reason: "{log.reason || 'Operation performed'}"
                  </div>
                </div>

                <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Global Modals */}
      {showBudgetModal && (
        <BudgetModal
          project={project}
          onClose={() => setShowBudgetModal(false)}
          onSave={handleUpdateBudget}
        />
      )}

      {showTaskModal && (
        <TaskModal
          task={selectedTask}
          projectId={projectId}
          onClose={() => setShowTaskModal(false)}
          onSave={handleSaveTask}
        />
      )}

      {showRequestChangeModal && (
        <RequestChangeModal
          projects={[project]}
          preselectedProjectId={project._id}
          onClose={() => setShowRequestChangeModal(false)}
          onRequestSubmitted={loadProjectData}
        />
      )}

      {showArchiveModal && (
        <ProjectArchiveModal
          project={project}
          onClose={() => setShowArchiveModal(false)}
          onArchived={() => {
            loadProjectData();
            onBack();
          }}
        />
      )}

      {showUploadDocModal && (
        <DocumentUploadModal
          projectId={project._id}
          projects={[project]}
          onClose={() => setShowUploadDocModal(false)}
          onUploaded={loadProjectData}
        />
      )}
    </div>
  );
};
