const { chromium } = require('playwright');

/**
 * Scrapes Google Maps for businesses matching a niche + city query.
 * Returns an array of lead objects.
 */
async function scrapeGoogleMaps(niche, city, maxResults = 20) {
  const query = `${niche} in ${city}`;
  const leads = [];

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  const page = await context.newPage();

  try {
    console.log(`🔍 Scraping Google Maps: "${query}"`);

    // Navigate to Google Maps search
    await page.goto(
      `https://www.google.com/maps/search/${encodeURIComponent(query)}`,
      { waitUntil: 'domcontentloaded', timeout: 30000 }
    );

    // Wait for results panel to appear
    await page.waitForSelector('[role="feed"]', { timeout: 20000 });

    // Scroll the results panel to load more listings
    const feed = page.locator('[role="feed"]');
    let prevCount = 0;
    for (let i = 0; i < 5; i++) {
      await feed.evaluate((el) => el.scrollBy(0, 1500));
      await page.waitForTimeout(1500);
      const count = await page.locator('[role="feed"] > div > div > a').count();
      if (count >= maxResults || count === prevCount) break;
      prevCount = count;
    }

    // Extract all listing links
    const listingLinks = await page
      .locator('[role="feed"] > div > div > a')
      .evaluateAll((els) => els.map((el) => el.href));

    console.log(`📍 Found ${listingLinks.length} listings`);

    // Visit each listing and extract details
    for (const link of listingLinks.slice(0, maxResults)) {
      try {
        await page.goto(link, { waitUntil: 'domcontentloaded', timeout: 20000 });
        await page.waitForTimeout(1000);

        const lead = await page.evaluate(() => {
          const getText = (selector) => {
            const el = document.querySelector(selector);
            return el ? el.textContent.trim() : null;
          };

          // Business name
          const name =
            document.querySelector('h1.DUwDvf')?.textContent.trim() || null;

          // Website button href
          const websiteEl = document.querySelector('a[data-item-id="authority"]');
          const website = websiteEl ? websiteEl.href : null;

          // Phone
          const phoneEl = document.querySelector(
            'button[data-item-id^="phone:"]'
          );
          const phone = phoneEl
            ? phoneEl.getAttribute('data-item-id').replace('phone:', '')
            : null;

          // Address
          const addressEl = document.querySelector(
            'button[data-item-id="address"]'
          );
          const address = addressEl
            ? addressEl.querySelector('.Io6YTe')?.textContent.trim()
            : null;

          // Rating
          const ratingEl = document.querySelector('.F7nice span[aria-hidden]');
          const rating = ratingEl ? parseFloat(ratingEl.textContent) : null;

          // Review count
          const reviewEl = document.querySelector('.F7nice span[aria-label]');
          const reviews = reviewEl
            ? parseInt(reviewEl.getAttribute('aria-label').replace(/\D/g, ''))
            : null;

          // Category
          const categoryEl = document.querySelector(
            'button.DkEaL, span.DkEaL'
          );
          const category = categoryEl ? categoryEl.textContent.trim() : null;

          return { name, website, phone, address, rating, reviews, category };
        });

        if (lead.name) {
          leads.push({
            ...lead,
            source_url: page.url(),
            niche,
            city,
            scraped_at: new Date().toISOString(),
          });
          console.log(`✅ ${lead.name} | website: ${lead.website || 'NONE'}`);
        }
      } catch (err) {
        console.warn(`⚠️  Failed to scrape listing: ${err.message}`);
      }
    }
  } finally {
    await browser.close();
  }

  return leads;
}

module.exports = { scrapeGoogleMaps };
