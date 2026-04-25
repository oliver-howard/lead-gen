require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const leadsRouter = require('./routes/leads');
const scrapeRouter = require('./routes/scrape');
const emailRouter = require('./routes/email');
const authRouter = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // Allow all for local development to avoid "Failed to fetch" issues
app.use(express.json());

// Routes
app.use('/api/leads', leadsRouter);
app.use('/api/scrape', scrapeRouter);
app.use('/api/email', emailRouter);
app.use('/auth', authRouter);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`🚀 Lead Gen backend running on http://localhost:${PORT}`);
});
