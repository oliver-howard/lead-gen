const { chromium } = require('playwright');

/**
 * Runs a Lighthouse-style audit on a website using Playwright.
 * Uses the Chrome DevTools Protocol (CDP) to measure performance metrics.
 * Returns normalized scores 0–100.
 */
async function auditWebsite(url) {
  if (!url) return null;

  // Ensure URL has protocol
  const targetUrl = url.startsWith('http') ? url : `https://${url}`;

  const browser = await chromium.launch({ headless: true });

  try {
    // --- Mobile audit ---
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      userAgent:
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1',
    });
    const mobilePage = await mobileContext.newPage();
    const mobileMetrics = await measurePerformance(mobilePage, targetUrl);
    await mobileContext.close();

    // --- Desktop audit ---
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
    });
    const desktopPage = await desktopContext.newPage();
    const desktopMetrics = await measurePerformance(desktopPage, targetUrl);
    await desktopContext.close();

    // Check SSL
    const hasSSL = targetUrl.startsWith('https://');

    // Detect if site looks outdated (basic heuristic: no viewport meta = old)
    const hasViewportMeta = mobileMetrics.hasViewportMeta;

    return {
      url: targetUrl,
      mobile_score: mobileMetrics.score,
      desktop_score: desktopMetrics.score,
      lcp_ms: mobileMetrics.lcp,
      fcp_ms: mobileMetrics.fcp,
      has_ssl: hasSSL,
      is_mobile_responsive: hasViewportMeta,
      audited_at: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`⚠️  Audit failed for ${url}: ${err.message}`);
    return {
      url: targetUrl,
      mobile_score: null,
      desktop_score: null,
      lcp_ms: null,
      fcp_ms: null,
      has_ssl: targetUrl.startsWith('https://'),
      is_mobile_responsive: null,
      audited_at: new Date().toISOString(),
      error: err.message,
    };
  } finally {
    await browser.close();
  }
}

async function measurePerformance(page, url) {
  try {
    const startTime = Date.now();
    const response = await page.goto(url, {
      waitUntil: 'load',
      timeout: 20000,
    });
    const loadTime = Date.now() - startTime;

    // Check for viewport meta tag
    const hasViewportMeta = await page
      .locator('meta[name="viewport"]')
      .count()
      .then((c) => c > 0);

    // Get performance timing
    const timing = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      const fcp = paint.find((e) => e.name === 'first-contentful-paint');

      // Try to get LCP from PerformanceObserver entries
      const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
      const lcp = lcpEntries.length > 0 ? lcpEntries[lcpEntries.length - 1] : null;

      return {
        domInteractive: nav ? Math.round(nav.domInteractive) : null,
        domComplete: nav ? Math.round(nav.domComplete) : null,
        fcp: fcp ? Math.round(fcp.startTime) : null,
        lcp: lcp ? Math.round(lcp.startTime) : null,
        transferSize: nav ? nav.transferSize : null,
      };
    });

    // Simple scoring heuristic (0–100)
    // Based on load time: <2s = 90+, 2-4s = 60-90, 4-6s = 30-60, >6s = <30
    let score = 100;
    if (loadTime > 2000) score -= Math.min(40, ((loadTime - 2000) / 100));
    if (!hasViewportMeta) score -= 20;
    if (!url.startsWith('https://')) score -= 10;
    score = Math.max(0, Math.round(score));

    return {
      score,
      fcp: timing.fcp,
      lcp: timing.lcp,
      loadTime,
      hasViewportMeta,
      statusCode: response ? response.status() : null,
    };
  } catch {
    return { score: 0, fcp: null, lcp: null, loadTime: null, hasViewportMeta: false };
  }
}

module.exports = { auditWebsite };
