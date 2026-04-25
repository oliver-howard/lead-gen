#!/usr/bin/env node
/**
 * Local scraper script — run this on your machine to discover new leads.
 * Usage: node scraper/run.js --niche "law firm" --city "Austin TX" --max 20
 *
 * This CANNOT run on Vercel (needs Playwright + Chromium).
 * Run it locally and results go straight to Supabase.
 */
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { scrapeGoogleMaps } = require('./googleMaps');
const { auditWebsite } = require('./lighthouse');
const { findEmail, calculateLeadScore } = require('./enrich');
const supabase = require('../db/supabase');

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (name) => {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 ? args[idx + 1] : null;
};

const niche = getArg('niche') || 'law firm';
const city = getArg('city') || 'Austin TX';
const max = parseInt(getArg('max') || '20', 10);

async function run() {
  console.log(`\n🚀 Starting lead discovery`);
  console.log(`   Niche: ${niche}`);
  console.log(`   City:  ${city}`);
  console.log(`   Max:   ${max} leads\n`);

  // Step 1: Scrape Google Maps
  const rawLeads = await scrapeGoogleMaps(niche, city, max);
  console.log(`\n📍 Scraped ${rawLeads.length} listings\n`);

  let saved = 0;

  for (const lead of rawLeads) {
    try {
      // Step 2: Find email first (skip if not found)
      console.log(`📧 Finding email for ${lead.name}...`);
      const email = await findEmail(lead.website, lead.name);

      if (!email) {
        console.warn(`⏭️  Skipping ${lead.name} - No email found.`);
        continue;
      }

      // Step 3: Audit website (if they have one)
      let auditData = {};
      if (lead.website) {
        console.log(`🔬 Auditing ${lead.website}...`);
        const audit = await auditWebsite(lead.website);
        if (audit) {
          auditData = {
            mobile_score: audit.mobile_score,
            desktop_score: audit.desktop_score,
            has_ssl: audit.has_ssl,
            is_mobile_responsive: audit.is_mobile_responsive,
            cms: audit.cms,
          };
        }
      }

      // Step 4: Calculate score
      const enrichedLead = { ...lead, ...auditData, email };
      const score = calculateLeadScore(enrichedLead);

      // Step 5: Save to Supabase (upsert by name + city to avoid duplicates)
      const { error } = await supabase.from('leads').upsert(
        {
          name: lead.name,
          niche: lead.niche,
          city: lead.city,
          address: lead.address,
          phone: lead.phone,
          website: lead.website,
          email,
          rating: lead.rating,
          reviews: lead.reviews,
          category: lead.category,
          source_url: lead.source_url,
          ...auditData,
          lead_score: score,
          status: 'new',
          scraped_at: lead.scraped_at,
        },
        { onConflict: 'name,city', ignoreDuplicates: true }
      );

      if (!error) {
        saved++;
        const indicator = score >= 60 ? '🔥' : score >= 40 ? '⭐' : '•';
        console.log(`${indicator} Saved: ${lead.name} (score: ${score})`);
      } else {
        console.warn(`⚠️  Skipped duplicate: ${lead.name}`);
      }
    } catch (err) {
      console.error(`❌ Error processing ${lead.name}: ${err.message}`);
    }
  }

  console.log(`\n✅ Done! Saved ${saved}/${rawLeads.length} new leads to Supabase.\n`);
  process.exit(0);
}

run().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
