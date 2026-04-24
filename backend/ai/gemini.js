const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates a personalized cold email for a lead using Gemini 2.5 Flash.
 * @param {object} lead - The lead object from the database
 * @returns {object} { subject, body }
 */
async function generateEmail(lead) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Build context string based on what we know
  const websiteContext = lead.website
    ? `Their website: ${lead.website}
Mobile performance score: ${lead.mobile_score ?? 'unknown'}/100
Desktop performance score: ${lead.desktop_score ?? 'unknown'}/100
Has SSL certificate: ${lead.has_ssl ? 'Yes' : 'No'}
Mobile responsive: ${lead.is_mobile_responsive ? 'Yes' : 'No'}`
    : `They have NO website — only a Google Maps listing.`;

  const prompt = `You are Oliver Howard, a professional web developer based in the US.

You are writing a cold outreach email to a potential client with these details:
- Business name: ${lead.name}
- Industry: ${lead.category || lead.niche}
- City: ${lead.city}
- Rating: ${lead.rating ? `${lead.rating}/5 (${lead.reviews} reviews)` : 'Unknown'}
- Phone: ${lead.phone || 'Not found'}
${websiteContext}

Write a cold outreach email that:
1. Has a punchy, specific subject line (not generic)
2. Opens with ONE very specific observation about THIS business (not generic flattery)
3. Mentions their most important pain point from the data above in plain English
4. Offers a free, no-obligation 15-minute website strategy call
5. Is under 150 words in the body
6. Sounds like a real human, not a marketing template
7. Signs off as "Oliver" — no last name, no title
8. NEVER uses phrases like "I hope this email finds you well", "I came across your business", or "I'd love to connect"

Respond with ONLY valid JSON in this exact format, no markdown, no code fences:
{
  "subject": "the subject line here",
  "body": "the full email body here with \\n for line breaks"
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  try {
    // Strip markdown code fences if model adds them
    const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      subject: parsed.subject,
      body: parsed.body,
    };
  } catch (err) {
    console.error('Failed to parse Gemini response:', text);
    throw new Error('Gemini returned invalid JSON');
  }
}

module.exports = { generateEmail };
