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
 * Calculate a refined lead score 0–100 based on enrichment data.
 * Focused on Business Value (40%), Technical Need (35%), and Platform (25%).
 */
function calculateLeadScore(lead) {
  let business = 0;
  // A. Business Value (40%)
  if (lead.reviews > 200) business = 40;
  else if (lead.reviews > 50) business = 35;
  else if (lead.reviews > 10) business = 25;
  else business = 10;
  
  if (lead.rating > 4.5) business += 5;
  else if (lead.rating < 3.5) business -= 5;

  // B. Technical Need (35%)
  let tech = 0;
  if (!lead.website) {
    tech = 15; // High need, but lower confidence without a site to audit
  } else {
    if (lead.mobile_score !== null) {
      if (lead.mobile_score < 40) tech += 20;
      else if (lead.mobile_score < 70) tech += 10;
    }
    if (lead.is_mobile_responsive === false) tech += 10;
    if (lead.has_ssl === false) tech += 5;
  }

  // C. Platform/CMS Bonus (25%)
  let platform = 0;
  const templatePlatforms = ['Wix', 'Squarespace', 'GoDaddy', 'WordPress', 'Shopify'];
  if (lead.cms && templatePlatforms.includes(lead.cms)) {
    platform = 25;
  } else if (!lead.website) {
    platform = 10;
  }

  let total = business + tech + platform;

  // Multipliers for "Unicorn" leads
  // High volume business + Terrible mobile performance
  if (lead.reviews > 100 && lead.mobile_score !== null && lead.mobile_score < 50) {
    total *= 1.2;
  }

  return Math.min(100, Math.max(0, Math.round(total)));
}

module.exports = { findEmail, calculateLeadScore };
