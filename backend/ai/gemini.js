const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Generates a personalized cold email for a lead using Gemini 3 Flash.
 * @param {object} lead - The lead object from the database
 * @returns {object} { subject, body }
 */
async function generateEmail(lead) {
  const model = genAI.getGenerativeModel({ model: 'gemini-3-flash-preview' });

  // Build context string based on what we know
  const websiteContext = lead.website
    ? `Their website: ${lead.website}
Platform: ${lead.cms || 'unknown'}
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
1. Has a clear subject line: "Inquiring about a website redesign for ${lead.name}"
2. Opens with an intro (My name is Oliver, and I am a new grad from UC Berkley with a small web development agency) followed by a specific observation about why their current online presence is outdated or suboptimal.
3. If they use a platform like Squarespace or Wix (Platform: ${lead.cms}), briefly mention how custom sites are significantly faster and more polished than those generic templates, which can lead to higher Google rankings and ultimately more sales/clients/etc.
4. NEVER uses generic flattery like "Your 4.8-star reputation deserves a better site." Do not mention their rating or reviews.
5. Positions yourself as an ongoing service partner who rebuilds websites from the ground up to be high-performance, modern machines.
6. Emphasizes that you are a complete website management solution—they would be outsourcing their entire digital presence to you so they never have to think about it again.
7. Mentions your website (https://invrse.dev) and encourages them to view your portfolio of work there.
8. Offers a free, no-obligation 15-minute website strategy call.
9. Is under 120 words in the body.
10. Sounds like a real human, not a marketing template.
11. Signs off as "Oliver" — no last name, no title.
12. NEVER uses phrases like "I hope this email finds you well", "I came across your business", or "I'd love to connect".

### EXAMPLES FOR TONE AND FORMAT:
EXAMPLE 1 (Existing slow site):
Input Lead: { "name": "Summit Law", "cms": "Wix", "mobile_score": 35 }
Output: {
  "subject": "Inquiring about a website redesign for Summit Law",
  "body": "Hi there,\\n\\nMy name is Oliver, and I am a new grad from UC Berkley with a small web development agency. I just ran a performance audit on the Summit Law site and noticed it's taking nearly 8 seconds to become interactive on mobile. For a law firm, that delay translates directly to lost consultations. It looks like the site is built on Wix, which is likely the bottleneck—those templates just can't compete with a custom-engineered build.\\n\\nI build high-performance sites from the ground up and manage the entire digital presence for my clients so they can focus on their cases. You can see the quality of my work at https://invrse.dev.\\n\\nWould you be open to a 15-minute strategy call to discuss a redesign that actually converts?\\n\\nOliver"
}
EXAMPLE 2 (No website):
Input Lead: { "name": "Downtown Auto", "website": null }
Output: {
  "subject": "Inquiring about a website redesign for Downtown Auto",
  "body": "Hi,\\n\\nI was searching for auto shops in ${lead.city} and noticed Downtown Auto is only relying on a Google Maps listing. While that's a start, you're missing out on a huge chunk of customers who expect a professional site before they trust someone with their car.\\n\\nI build and manage digital homes for local businesses, taking the entire tech burden off your plate so you never have to worry about it again. Check out my portfolio at https://invrse.dev to see what I mean.\\n\\nDo you have 15 minutes this week for a quick strategy call?\\n\\nOliver"
}
### YOUR TURN:
Respond with ONLY valid JSON for the lead provided above:
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
