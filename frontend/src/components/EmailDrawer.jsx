import { useState, useEffect } from 'react';
import { X, Send, Trash2, Save, Sparkles, User, Briefcase, Mail as MailIcon, Clock } from 'lucide-react';
import supabase from '../lib/supabase';

export default function EmailDrawer({ email, onClose, onUpdate, showToast }) {
  const [subject, setSubject] = useState(email.subject || '');
  const [body, setBody] = useState(email.body || '');
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isDraft = email.status === 'draft';

  useEffect(() => {
    setSubject(email.subject || '');
    setBody(email.body || '');
  }, [email]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/email/${email.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      showToast('Changes saved');
      onUpdate(data.email);
    } catch (err) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    if (!isDraft) return;
    setSending(true);
    try {
      // Save first to ensure latest content is sent
      await fetch(`/api/email/${email.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, body }),
      });

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: email.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Email sent! 🚀');
      onUpdate({ ...email, status: 'sent', sent_at: new Date().toISOString() });
      onClose();
    } catch (err) {
      showToast(err.message || 'Send failed', 'error');
    } finally {
      setSending(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this draft?')) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/email/${email.id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      showToast('Draft deleted');
      onUpdate(null, email.id); // Signal deletion
      onClose();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-header">
          <div>
            <div style={{ fontWeight: 700, fontSize: 16 }}>
              {isDraft ? 'Edit Draft' : 'Email Details'}
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} /> {isDraft ? 'Last edited ' : 'Sent on '} 
              {new Date(email.updated_at || email.generated_at || email.sent_at).toLocaleString()}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}><X size={14} /></button>
        </div>

        <div className="drawer-body">
          {/* Lead Info context */}
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius)', padding: '14px' }}>
            <div className="section-label" style={{ marginBottom: 8 }}>Recipient Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <User size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ fontWeight: 500 }}>{email.leads?.name || 'Unknown Lead'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <Briefcase size={14} style={{ color: 'var(--text-muted)' }} />
                <span>{email.leads?.category || email.leads?.niche} · {email.leads?.city}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                <MailIcon size={14} style={{ color: 'var(--text-muted)' }} />
                <span style={{ color: 'var(--accent-light)' }}>{email.leads?.email || 'No email found'}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label className="form-label">Subject</label>
              <input 
                className="input" 
                style={{ width: '100%' }} 
                value={subject} 
                onChange={e => setSubject(e.target.value)}
                readOnly={!isDraft}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Message Body</label>
              <textarea
                className="email-preview"
                style={{ minHeight: '300px' }}
                value={body}
                onChange={e => setBody(e.target.value)}
                readOnly={!isDraft}
              />
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          {isDraft ? (
            <>
              <button className="btn btn-primary" onClick={handleSend} disabled={sending || saving || !email.leads?.email} style={{ flex: 1, justifyContent: 'center' }}>
                {sending ? <><span className="spinner" /> Sending...</> : <><Send size={14} /> Send Now</>}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={handleSave} disabled={saving || sending}>
                {saving ? <span className="spinner" /> : <Save size={14} />} Save
              </button>
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={handleDelete} disabled={deleting || sending}>
                {deleting ? <span className="spinner" /> : <Trash2 size={14} />}
              </button>
            </>
          ) : (
            <div style={{ flex: 1, color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', padding: '8px' }}>
              This email has already been sent and cannot be edited.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
