const express = require('express');
const router = express.Router();

// Scraping is CLI-only (Playwright can't run in serverless)
// This route just returns a helpful message
router.post('/start', (req, res) => {
  const { niche, city, max = 20 } = req.body;
  res.json({
    message: 'Run the scraper locally from your terminal:',
    command: `cd backend && node scraper/run.js --niche "${niche}" --city "${city}" --max ${max}`,
  });
});

module.exports = router;
