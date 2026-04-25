const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');

// Simple lock to prevent multiple jobs
let isJobRunning = false;

router.post('/start', (req, res) => {
  if (isJobRunning) {
    return res.status(400).json({ error: 'A discovery job is already running.' });
  }

  const { niche, city, max = 20 } = req.body;

  if (!niche || !city) {
    return res.status(400).json({ error: 'Niche and City are required.' });
  }

  isJobRunning = true;

  // Set headers for streaming more robustly
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });

  // Send a small initial chunk to ensure the stream starts
  res.write(`🚀 Starting discovery job for "${niche}" in "${city}"...\n`);
  res.write(`⏱  Max leads: ${max}\n`);
  res.write(`──────────────────────────────────────────────────\n\n`);

  const scraperPath = path.resolve(__dirname, '../scraper/run.js');
  const scraperArgs = [
    scraperPath,
    '--niche', niche,
    '--city', city,
    '--max', max.toString()
  ];
  
  console.log(`🚀 Spawning scraper: ${process.execPath} ${scraperArgs.join(' ')}`);

  const child = spawn(process.execPath, scraperArgs, {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env }
  });

  child.stdout.on('data', (data) => {
    const text = data.toString();
    console.log(`[Scraper] ${text.trim()}`);
    res.write(text);
  });

  child.stderr.on('data', (data) => {
    const text = data.toString();
    console.error(`[Scraper Error] ${text.trim()}`);
    res.write(`⚠️ ERROR: ${text}`);
  });

  child.on('close', (code, signal) => {
    console.log(`Scraper process exited. code=${code}, signal=${signal}`);
    isJobRunning = false;
    res.write(`\n✅ Job finished with code ${code} ${signal ? `(signal: ${signal})` : ''}\n`);
    res.end();
  });

  child.on('error', (err) => {
    console.error(`Failed to start scraper: ${err.message}`);
    isJobRunning = false;
    res.write(`\n❌ Fatal error: ${err.message}\n`);
    res.end();
  });

  // Handle client disconnect
  req.on('close', () => {
    if (isJobRunning) {
      console.log('Client connection closed. (Cleanup disabled for debugging)');
      // Temporarily disabled child.kill() to see if it survives
      // child.kill('SIGTERM');
      // isJobRunning = false;
    }
  });



});

module.exports = router;

