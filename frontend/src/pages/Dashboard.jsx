import { useState, useEffect, useCallback } from 'react';
import { Search, Filter, RefreshCw, Globe, Phone, Mail, Star, CheckSquare, Square, Trash2, Tag, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import supabase from '../lib/supabase';
import LeadDrawer from '../components/LeadDrawer';
import Toast from '../components/Toast';

const STATUS_FILTERS = ['all', 'new', 'draft', 'emailed', 'replied', 'booked', 'archived'];
const SORT_OPTIONS = [
  { label: 'Score', field: 'lead_score' },
  { label: 'Name', field: 'name' },
  { label: 'Rating', field: 'rating' },
  { label: 'Reviews', field: 'reviews' },
  { label: 'Newest', field: 'scraped_at' },
];

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
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortBy, setSortBy] = useState('scraped_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ total: 0, emailed: 0, replied: 0, highScore: 0 });
  const [bulkStatus, setBulkStatus] = useState('');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('leads')
      .select('*')
      .order(sortBy, { ascending: sortOrder === 'asc' });

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    } else {
      query = query.neq('status', 'archived');
    }
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
      setSelectedIds([]); // Reset selection on refresh/filter
    }
    setLoading(false);
  }, [search, statusFilter, sortBy, sortOrder]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === leads.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(leads.map(l => l.id));
    }
  };

  const toggleSelectLead = (id, e) => {
    e.stopPropagation();
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatusUpdate = async (status) => {
    if (!status || selectedIds.length === 0) return;
    
    try {
      const res = await fetch('/api/leads/bulk-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedIds, status }),
      });
      
      if (!res.ok) throw new Error('Bulk update failed');
      
      showToast(`Updated ${selectedIds.length} leads to ${status}`);
      fetchLeads();
      setBulkStatus('');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <ArrowUpDown size={12} style={{ opacity: 0.3, marginLeft: 6 }} />;
    return sortOrder === 'asc' ? <ArrowUp size={12} style={{ marginLeft: 6, color: 'var(--accent)' }} /> : <ArrowDown size={12} style={{ marginLeft: 6, color: 'var(--accent)' }} />;
  };

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Lead Pipeline</div>
          <div className="page-subtitle">Manage and track your outreach prospects</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {selectedIds.length > 0 && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 10, 
              background: 'var(--accent-glow)', 
              padding: '4px 12px', 
              borderRadius: 'var(--radius)',
              border: '1px solid var(--accent)',
              animation: 'slideIn 0.2s ease'
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-light)' }}>
                {selectedIds.length} selected
              </span>
              <select 
                className="input" 
                style={{ height: 32, padding: '0 8px', fontSize: 12 }}
                value={bulkStatus}
                onChange={e => handleBulkStatusUpdate(e.target.value)}
              >
                <option value="">Change Status...</option>
                {STATUS_FILTERS.filter(s => s !== 'all').map(s => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={fetchLeads}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
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
            <div style={{ display: 'flex', gap: 10 }}>
              <select
                className="input"
                value={`${sortBy}-${sortOrder}`}
                onChange={e => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <option value="lead_score-desc">Highest Score</option>
                <option value="lead_score-asc">Lowest Score</option>
                <option value="rating-desc">Highest Rating</option>
                <option value="reviews-desc">Most Reviews</option>
                <option value="scraped_at-desc">Newest First</option>
                <option value="name-asc">A-Z</option>
              </select>
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
                  <th style={{ width: 40, textAlign: 'center' }}>
                    <button 
                      onClick={toggleSelectAll} 
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      {selectedIds.length === leads.length ? <CheckSquare size={16} color="var(--accent)" /> : <Square size={16} />}
                    </button>
                  </th>
                  <th onClick={() => toggleSort('name')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Business <SortIcon field="name" /></div>
                  </th>
                  <th>Niche / City</th>
                  <th>Website</th>
                  <th onClick={() => toggleSort('lead_score')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Score <SortIcon field="lead_score" /></div>
                  </th>
                  <th onClick={() => toggleSort('status')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Status <SortIcon field="status" /></div>
                  </th>
                  <th onClick={() => toggleSort('rating')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>Rating <SortIcon field="rating" /></div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {leads.map(lead => (
                  <tr 
                    key={lead.id} 
                    onClick={() => setSelectedLead(lead)}
                    className={selectedIds.includes(lead.id) ? 'selected-row' : ''}
                    style={selectedIds.includes(lead.id) ? { background: '#6366f10a' } : {}}
                  >
                    <td style={{ textAlign: 'center' }}>
                      <button 
                        onClick={(e) => toggleSelectLead(lead.id, e)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                      >
                        {selectedIds.includes(lead.id) ? <CheckSquare size={16} color="var(--accent)" /> : <Square size={16} />}
                      </button>
                    </td>
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
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {lead.city}
                        {lead.cms && <span style={{ padding: '1px 5px', background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 4, fontSize: 10, color: 'var(--accent-light)' }}>{lead.cms}</span>}
                      </div>
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
