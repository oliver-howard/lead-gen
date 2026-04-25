import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, RefreshCw, Mail, Send, Clock, Edit2, Trash2, CheckCircle2 } from 'lucide-react';
import EmailDrawer from '../components/EmailDrawer';
import Toast from '../components/Toast';

const STATUS_FILTERS = ['all', 'draft', 'sent'];

function StatusChip({ status }) {
  const map = {
    draft: 'chip-draft',
    sent: 'chip-emailed',
  };
  const icon = status === 'sent' ? <CheckCircle2 size={11} /> : <Clock size={11} />;
  return (
    <span className={`chip ${map[status] || 'chip-new'}`}>
      {icon} {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function Emails() {
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ total: 0, drafts: 0, sent: 0 });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchEmails = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/email');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const allEmails = data.emails || [];
      setEmails(allEmails);
      setStats({
        total: allEmails.length,
        drafts: allEmails.filter(e => e.status === 'draft').length,
        sent: allEmails.filter(e => e.status === 'sent').length,
      });
    } catch (err) {
      showToast('Failed to load emails', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchEmails(); }, [fetchEmails]);

  const filteredEmails = emails.filter(email => {
    const matchesSearch = 
      email.leads?.name?.toLowerCase().includes(search.toLowerCase()) || 
      email.leads?.city?.toLowerCase().includes(search.toLowerCase()) || 
      email.leads?.niche?.toLowerCase().includes(search.toLowerCase()) ||
      email.leads?.category?.toLowerCase().includes(search.toLowerCase()) ||
      email.subject?.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || email.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleUpdate = (updatedEmail, deletedId) => {
    if (deletedId) {
      setEmails(prev => prev.filter(e => e.id !== deletedId));
    } else if (updatedEmail) {
      setEmails(prev => prev.map(e => e.id === updatedEmail.id ? updatedEmail : e));
    }
    // Refresh stats
    fetchEmails();
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Email Outreach</div>
          <div className="page-subtitle">Track your drafts and communication history</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchEmails} disabled={loading}>
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-label">Total Outbound</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-sub">emails tracked</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Drafts</div>
            <div className="stat-value" style={{ color: 'var(--amber)' }}>{stats.drafts}</div>
            <div className="stat-sub">awaiting review</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Sent</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.sent}</div>
            <div className="stat-sub">delivered to inbox</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Conversion</div>
            <div className="stat-value" style={{ color: 'var(--accent-light)' }}>
              {stats.total > 0 ? Math.round((stats.sent / stats.total) * 100) : 0}%
            </div>
            <div className="stat-sub">send rate</div>
          </div>
        </div>

        {/* Filters & Table */}
        <div className="table-wrapper">
          <div className="table-toolbar">
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                style={{ paddingLeft: 30, width: '100%' }}
                placeholder="Search by recipient or subject..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {STATUS_FILTERS.map(s => (
                <button
                  key={s}
                  className={`btn btn-sm ${statusFilter === s ? 'btn-primary' : 'btn-ghost'}`}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="empty-state"><span className="spinner" /></div>
          ) : filteredEmails.length === 0 ? (
            <div className="empty-state">
              <Mail />
              <p>No emails found. Start by generating a draft from the Dashboard.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmails.map(email => (
                  <tr key={email.id} onClick={() => setSelectedEmail(email)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{email.leads?.name || 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {email.leads?.category || email.leads?.niche} · {email.leads?.city}
                      </div>
                    </td>
                    <td>
                      <div style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {email.subject}
                      </div>
                    </td>
                    <td><StatusChip status={email.status} /></td>
                    <td>
                      <div style={{ fontSize: 12 }}>
                        {new Date(email.generated_at).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {new Date(email.generated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }} onClick={e => e.stopPropagation()}>
                        <button 
                          className="btn btn-ghost btn-sm" 
                          onClick={() => setSelectedEmail(email)}
                          title={email.status === 'draft' ? 'Edit Draft' : 'View Details'}
                        >
                          {email.status === 'draft' ? <Edit2 size={13} /> : <Search size={13} />}
                        </button>
                        {email.status === 'draft' && (
                          <button 
                            className="btn btn-ghost btn-sm" 
                            style={{ color: 'var(--red)' }}
                            onClick={() => {
                              if (window.confirm('Delete this draft?')) {
                                handleUpdate(null, email.id);
                                fetch(`/api/email/${email.id}`, { method: 'DELETE' });
                              }
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedEmail && (
        <EmailDrawer
          email={selectedEmail}
          onClose={() => setSelectedEmail(null)}
          onUpdate={handleUpdate}
          showToast={showToast}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
