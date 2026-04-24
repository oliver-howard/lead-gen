#!/usr/bin/env node
/**
 * One-time Gmail OAuth2 setup script.
 * Run this ONCE locally to get your refresh token, then add it to .env
 *
 * Usage: node auth/gmail-setup.js
 */
// Load .env.local first, then fall back to .env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { google } = require('googleapis');
const http = require('http');
const url = require('url');

const CLIENT_ID = process.env.GMAIL_CLIENT_ID;
const CLIENT_SECRET = process.env.GMAIL_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/auth/callback';

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.readonly',
];

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent', // Forces refresh token to be returned
});

console.log('\n🔐 Gmail OAuth2 Setup\n');
console.log('1. Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n2. Authorize your Google account');
console.log('3. You will be redirected back here automatically\n');

// Start a temporary local server to capture the OAuth callback
const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const code = parsedUrl.query.code;

  if (!code) {
    res.writeHead(400);
    res.end('No code found in callback URL');
    return;
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <h2>✅ Gmail OAuth2 Setup Complete!</h2>
      <p>Add this to your <code>.env</code> file:</p>
      <pre>GMAIL_REFRESH_TOKEN=${tokens.refresh_token}</pre>
      <p>You can close this window.</p>
    `);

    console.log('\n✅ Success! Add this to your .env file:\n');
    console.log(`GMAIL_REFRESH_TOKEN=${tokens.refresh_token}\n`);

    server.close();
    process.exit(0);
  } catch (err) {
    res.writeHead(500);
    res.end('Error getting tokens: ' + err.message);
    console.error('Error:', err);
    server.close();
    process.exit(1);
  }
});

server.listen(3001, () => {
  console.log('Waiting for OAuth callback on http://localhost:3001/auth/callback...\n');
});
