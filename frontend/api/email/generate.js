const { generateEmail } = require('../../ai/gemini');
const supabase = require('../../db/supabase');

// Vercel Serverless Function: POST /api/email/generate
module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { leadId } = req.body;
  if (!leadId) return res.status(400).json({ error: 'leadId is required' });

  // Fetch lead from Supabase
  const { data: lead, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single();

  if (error || !lead) {
    return res.status(404).json({ error: 'Lead not found' });
  }

  try {
    const { subject, body } = await generateEmail(lead);

    // Save draft to the emails table
    const { data: emailRecord, error: insertError } = await supabase
      .from('emails')
      .upsert({
        lead_id: leadId,
        subject,
        body,
        status: 'draft',
        generated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json({ email: emailRecord });
  } catch (err) {
    console.error('Email generation error:', err);
    return res.status(500).json({ error: err.message });
  }
};
