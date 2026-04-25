const express = require('express');
const router = express.Router();
const { generateEmail } = require('../ai/gemini');
const { google } = require('googleapis');
const supabase = require('../db/supabase');

// POST /api/email/generate
router.post('/generate', async (req, res) => {
  const { leadId } = req.body;
  if (!leadId) return res.status(400).json({ error: 'leadId is required' });

  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !lead) return res.status(404).json({ error: 'Lead not found' });

  try {
    const { subject, body } = await generateEmail(lead);

    const { data: emailRecord, error: insertError } = await supabase
      .from('emails')
      .upsert(
        { lead_id: leadId, subject, body, status: 'draft', generated_at: new Date().toISOString() },
        { onConflict: 'lead_id' }
      )
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({ email: emailRecord });
  } catch (err) {
    console.error('Generation error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

const { wrapEmailTemplate } = require('../email/template');

// POST /api/email/send
router.post('/send', async (req, res) => {
  const { emailId } = req.body;
  if (!emailId) return res.status(400).json({ error: 'emailId is required' });

  const { data: email, error } = await supabase
    .from('emails')
    .select('*, leads(*)')
    .eq('id', emailId)
    .single();

  if (error || !email) return res.status(404).json({ error: 'Email not found' });
  if (!email.leads?.email) return res.status(400).json({ error: 'Lead has no email address' });

  try {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      process.env.GMAIL_REDIRECT_URI
    );
    oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const htmlBody = wrapEmailTemplate(email.body, email.subject);

    const messageParts = [
      `To: ${email.leads.email}`,
      `Subject: ${email.subject}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      htmlBody,
    ];

    const rawMessage = Buffer.from(messageParts.join('\n'))
      .toString('base64')
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage },
    });

    await supabase.from('emails').update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      gmail_message_id: response.data.id,
    }).eq('id', emailId);

    await supabase.from('leads').update({
      status: 'emailed',
      last_contacted: new Date().toISOString(),
    }).eq('id', email.lead_id);

    return res.status(200).json({ success: true, gmailId: response.data.id });
  } catch (err) {
    console.error('Send error:', err.message);
    return res.status(500).json({ error: err.message });
  }
});

// GET /api/email
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('emails')
    .select('*, leads!inner(name, email, city, niche, category, status)')
    .neq('leads.status', 'archived')
    .order('generated_at', { ascending: false });

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ emails: data });
});

// PUT /api/email/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { subject, body } = req.body;

  const { data, error } = await supabase
    .from('emails')
    .update({ subject, body })
    .eq('id', id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ email: data });
});

// DELETE /api/email/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase
    .from('emails')
    .delete()
    .eq('id', id);

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ success: true });
});

module.exports = router;

