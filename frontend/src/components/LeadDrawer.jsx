import { useState } from 'react';
import { X, Globe, Phone, Mail, Star, Shield, Smartphone, Monitor, Sparkles, Send, ExternalLink } from 'lucide-react';
import supabase from '../lib/supabase';

function AuditBar({ label, score, icon: Icon }) {
  const color = score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 5 }}>
          {Icon && <Icon size={12} />} {label}
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color, fontFamily: "'JetBrains Mono', monospace" }}>
          {score !== null && score !== undefined ? `${score}/100` : 'N/A'}
        </span>
      </div>
      <div className="audit-bar">
        <div className="audit-bar-fill" style={{ width: `${score || 0}%`, background: color }} />
      </div>
    </div>
  );
}

export default function LeadDrawer({ lead, onClose, onUpdate, showToast }) {
  const [emailDraft, setEmailDraft] = useState(lead._draft || null);
  const [subject, setSubject] = useState(lead._subject || '');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/email/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubject(data.email.subject);
      setEmailDraft(data.email.body);
      showToast('Email draft generated!');
    } catch (err) {
      showToast(err.message || 'Generation failed', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!emailDraft) return;
    setSending(true);
    try {
      // Update draft in DB first
      const { data: emailRecord } = await supabase
        .from('emails')
        .upsert({ lead_id: lead.id, subject, body: emailDraft, status: 'draft' })
        .select().single();

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: emailRecord.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Email sent! 🚀');
      onUpdate({ ...lead, status: 'emailed' });
    } catch (err) {
      showToast(err.message || 'Send failed', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleArchive = async () => {
    await supabase.from('leads').update({ status: 'archived' }).eq('id', lead.id);
    onUpdate({ ...lead, status: 'archived' });
    showToast('Lead archived');
    onClose();
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{lead.name}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2 }}>
              {lead.category || lead.niche} · {lead.city}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="drawer-body">
          {/* Contact Info */}
          <div>
            <div className="section-label">Contact</div>
            <div className="info-grid">
              {lead.website && (
                <div className="info-item" style={{ gridColumn: '1 / -1' }}>
                  <div className="info-item-label"><Globe size={10} style={{ display: 'inline', marginRight: 4 }} />Website</div>
                  <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ color: 'var(--accent-light)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                    {lead.website} <ExternalLink size={11} />
                  </a>
                </div>
              )}
              {lead.phone && (
                <div className="info-item">
                  <div className="info-item-label"><Phone size={10} style={{ display: 'inline', marginRight: 4 }} />Phone</div>
                  <div className="info-item-value">{lead.phone}</div>
                </div>
              )}
              {lead.email && (
                <div className="info-item">
                  <div className="info-item-label"><Mail size={10} style={{ display: 'inline', marginRight: 4 }} />Email</div>
                  <div className="info-item-value" style={{ fontSize: 12 }}>{lead.email}</div>
                </div>
              )}
              {lead.rating && (
                <div className="info-item">
                  <div className="info-item-label"><Star size={10} style={{ display: 'inline', marginRight: 4 }} />Rating</div>
                  <div className="info-item-value">{lead.rating}/5 ({lead.reviews} reviews)</div>
                </div>
              )}
              <div className="info-item">
                <div className="info-item-label">Lead Score</div>
                <div className="info-item-value" style={{ color: lead.lead_score >= 60 ? 'var(--green)' : lead.lead_score >= 35 ? 'var(--amber)' : 'var(--red)', fontFamily: "'JetBrains Mono', monospace" }}>
                  {lead.lead_score}/100
                </div>
              </div>
            </div>
          </div>

          {/* Website Audit */}
          {lead.website && (
            <div>
              <div className="section-label">Website Audit</div>
              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius)', padding: '14px 16px' }}>
                <AuditBar label="Mobile Score" score={lead.mobile_score} icon={Smartphone} />
                <AuditBar label="Desktop Score" score={lead.desktop_score} icon={Monitor} />
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <span className={`chip ${lead.has_ssl ? 'chip-replied' : 'chip-new'}`}>
                    <Shield size={10} /> {lead.has_ssl ? 'SSL ✓' : 'No SSL'}
                  </span>
                  <span className={`chip ${lead.is_mobile_responsive ? 'chip-replied' : 'chip-new'}`}>
                    <Smartphone size={10} /> {lead.is_mobile_responsive ? 'Mobile OK' : 'Not Responsive'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {!lead.website && (
            <div style={{ background: '#ef444415', border: '1px solid #ef444430', borderRadius: 'var(--radius)', padding: '12px 14px', fontSize: 13, color: '#ef4444' }}>
              🚨 <strong>No website found</strong> — this is a high-priority lead.
            </div>
          )}

          {/* Email Draft */}
          <div>
            <div className="section-label">Outreach Email</div>
            {!emailDraft ? (
              <button className="btn btn-primary" onClick={handleGenerate} disabled={generating} style={{ width: '100%', justifyContent: 'center' }}>
                {generating ? <><span className="spinner" /> Generating with Gemini...</> : <><Sparkles size={14} /> Generate Personalized Email</>}
              </button>
            ) : (
              <>
                <div style={{ marginBottom: 8 }}>
                  <div className="form-label" style={{ marginBottom: 5 }}>Subject</div>
                  <input className="input" style={{ width: '100%' }} value={subject} onChange={e => setSubject(e.target.value)} />
                </div>
                <div style={{ marginBottom: 8 }}>
                  <div className="form-label" style={{ marginBottom: 5 }}>Body</div>
                  <textarea
                    className="email-preview"
                    value={emailDraft}
                    onChange={e => setEmailDraft(e.target.value)}
                  />
                </div>
                <button className="btn btn-ghost btn-sm" onClick={handleGenerate} disabled={generating}>
                  {generating ? <span className="spinner" /> : <Sparkles size={13} />}
                  Regenerate
                </button>
              </>
            )}
          </div>
        </div>

        <div className="drawer-footer">
          {emailDraft && lead.email && (
            <button className="btn btn-primary" onClick={handleSend} disabled={sending} style={{ flex: 1, justifyContent: 'center' }}>
              {sending ? <><span className="spinner" /> Sending...</> : <><Send size={14} /> Send Email</>}
            </button>
          )}
          {!lead.email && emailDraft && (
            <div style={{ flex: 1, fontSize: 12, color: 'var(--amber)', display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚠️ No email found — add one manually to send.
            </div>
          )}
          <button className="btn btn-ghost btn-sm" onClick={handleArchive}>Archive</button>
        </div>
      </div>
    </>
  );
}
