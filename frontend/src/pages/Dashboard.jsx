import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, RefreshCw, Globe, Phone, Mail, Star } from 'lucide-react';
import supabase from '../lib/supabase';
import LeadDrawer from '../components/LeadDrawer';
import Toast from '../components/Toast';

const STATUS_FILTERS = ['all', 'new', 'draft', 'emailed', 'replied', 'booked', 'archived'];

function ScoreBadge({ score }) {
  if (score === null || score === undefined) return <span style={{ color: 'var(--text-muted)' }}>—</span>;
  const cls = score >= 60 ? 'score-high' : score >= 35 ? 'score-mid' : 'score-low';
  return <span className={`score-badge ${cls}`}>{score}</span>;
}

function StatusChip({ status }) {
  const map = {
    new: 'chip-new', draft: 'chip-draft', emailed: 'chip-emailed',
    replied: 'chip-replied', booked: 'chip-booked', archived: 'chip-archived',
  };
  return <span className={`chip ${map[status] || 'chip-new'}`}>{status}</span>;
}

export default function Dashboard() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ total: 0, emailed: 0, replied: 0, highScore: 0 });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('leads')
      .select('*')
      .order('lead_score', { ascending: false });

    if (statusFilter !== 'all') query = query.eq('status', statusFilter);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error } = await query;
    if (error) { showToast('Failed to load leads', 'error'); }
    else {
      setLeads(data || []);
      setStats({
        total: data?.length || 0,
        emailed: data?.filter(l => ['emailed','replied','booked'].includes(l.status)).length || 0,
        replied: data?.filter(l => l.status === 'replied').length || 0,
        highScore: data?.filter(l => l.lead_score >= 60).length || 0,
      });
    }
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Lead Pipeline</div>
          <div className="page-subtitle">Manage and track your outreach prospects</div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={fetchLeads}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      <div className="page-body">
        {/* Stats */}
        <div className="stats-bar">
          <div className="stat-card">
            <div className="stat-label">Total Leads</div>
            <div className="stat-value">{stats.total}</div>
            <div className="stat-sub">in pipeline</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Hot Leads</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{stats.highScore}</div>
            <div className="stat-sub">score ≥ 60</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Emailed</div>
            <div className="stat-value" style={{ color: 'var(--accent-light)' }}>{stats.emailed}</div>
            <div className="stat-sub">contacted</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Replied</div>
            <div className="stat-value" style={{ color: 'var(--amber)' }}>{stats.replied}</div>
            <div className="stat-sub">awaiting call</div>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrapper">
          <div className="table-toolbar">
            <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
              <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                style={{ paddingLeft: 30, width: '100%' }}
                placeholder="Search leads..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select
              className="input"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              {STATUS_FILTERS.map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="empty-state"><span className="spinner" /></div>
          ) : leads.length === 0 ? (
            <div className="empty-state">
              <Search />
              <p>No leads found. Run a discovery job to get started.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Niche / City</th>
                  <th>Website</th>
                  <th>Score</th>
                  <th>Status</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead.id} onClick={() => setSelectedLead(lead)}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{lead.name}</div>
                      {lead.phone && (
                        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Phone size={11} /> {lead.phone}
                        </div>
                      )}
                    </td>
                    <td>
                      <div>{lead.category || lead.niche}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{lead.city}</div>
                    </td>
                    <td>
                      {lead.website ? (
                        <a
                          href={lead.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          style={{ color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12 }}
                        >
                          <Globe size={12} />
                          {new URL(lead.website.startsWith('http') ? lead.website : `https://${lead.website}`).hostname}
                        </a>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--red)' }}>No website</span>
                      )}
                    </td>
                    <td><ScoreBadge score={lead.lead_score} /></td>
                    <td><StatusChip status={lead.status} /></td>
                    <td>
                      {lead.rating ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Star size={12} style={{ color: 'var(--amber)' }} />
                          {lead.rating} <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>({lead.reviews})</span>
                        </span>
                      ) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={(updated) => {
            setLeads(prev => prev.map(l => l.id === updated.id ? updated : l));
            setSelectedLead(updated);
          }}
          showToast={showToast}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  );
}
