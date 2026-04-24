const { chromium } = require('playwright');

/**
 * Attempts to find a contact email for a business.
 * Strategy: scrape their website's contact page for mailto: links.
 */
async function findEmail(websiteUrl, businessName) {
  if (!websiteUrl) return null;

  const baseUrl = websiteUrl.startsWith('http')
    ? websiteUrl
    : `https://${websiteUrl}`;

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Common contact page paths to try
    const contactPaths = ['', '/contact', '/contact-us', '/about', '/about-us'];

    for (const path of contactPaths) {
      try {
        await page.goto(`${baseUrl}${path}`, {
          waitUntil: 'domcontentloaded',
          timeout: 10000,
        });

        // Extract mailto links
        const emails = await page.evaluate(() => {
          const mailtoLinks = Array.from(
            document.querySelectorAll('a[href^="mailto:"]')
          );
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const bodyText = document.body.innerText;
          const textEmails = bodyText.match(emailRegex) || [];
          const hrefEmails = mailtoLinks.map((a) =>
            a.href.replace('mailto:', '').split('?')[0]
          );
          return [...new Set([...hrefEmails, ...textEmails])];
        });

        // Filter out generic/noreply addresses
        const filtered = emails.filter(
          (e) =>
            !e.includes('noreply') &&
            !e.includes('no-reply') &&
            !e.includes('example.com') &&
            e.includes('.')
        );

        if (filtered.length > 0) {
          await browser.close();
          return filtered[0]; // Return best match
        }
      } catch {
        // Try next path
      }
    }
  } catch (err) {
    console.warn(`⚠️  Email scrape failed for ${websiteUrl}: ${err.message}`);
  } finally {
    await browser.close();
  }

  return null;
}

/**
 * Calculate a lead score 0–100 based on enrichment data.
 */
function calculateLeadScore(lead) {
  let score = 0;

  // No website = highest priority
  if (!lead.website) {
    score += 40;
  } else {
    // Website exists — audit-based scoring
    if (lead.mobile_score !== null) {
      if (lead.mobile_score < 30) score += 25;
      else if (lead.mobile_score < 60) score += 15;
      else if (lead.mobile_score < 80) score += 5;
    }
    if (!lead.has_ssl) score += 10;
    if (!lead.is_mobile_responsive) score += 15;
  }

  // Good reviews = real business worth reaching out to
  if (lead.reviews >= 10) score += 5;
  if (lead.reviews >= 50) score += 5;

  // Has a findable email = more likely to convert
  if (lead.email) score += 5;

  return Math.min(100, score);
}

module.exports = { findEmail, calculateLeadScore };
