const { google } = require('googleapis');
const supabase = require('../../db/supabase');

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI
);

// Vercel Serverless Function: POST /api/email/send
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { emailId } = req.body;
  if (!emailId) return res.status(400).json({ error: 'emailId is required' });

  // Fetch email draft + lead
  const { data: email, error } = await supabase
    .from('emails')
    .select('*, leads(*)')
    .eq('id', emailId)
    .single();

  if (error || !email) return res.status(404).json({ error: 'Email not found' });
  if (!email.leads?.email) return res.status(400).json({ error: 'Lead has no email address' });

  try {
    oauth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Build RFC 2822 message
    const toAddress = email.leads.email;
    const subject = email.subject;
    const body = email.body;

    const messageParts = [
      `To: ${toAddress}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      'MIME-Version: 1.0',
      '',
      body,
    ];

    const rawMessage = Buffer.from(messageParts.join('\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage },
    });

    // Update email record status
    await supabase
      .from('emails')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        gmail_message_id: response.data.id,
      })
      .eq('id', emailId);

    // Update lead status
    await supabase
      .from('leads')
      .update({ status: 'emailed', last_contacted: new Date().toISOString() })
      .eq('id', email.lead_id);

    return res.status(200).json({ success: true, gmailId: response.data.id });
  } catch (err) {
    console.error('Gmail send error:', err);
    return res.status(500).json({ error: err.message });
  }
};
