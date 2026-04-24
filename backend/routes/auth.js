const express = require('express');
const router = express.Router();

// Placeholder — Gmail OAuth setup is done via `npm run gmail-setup`
router.get('/google/callback', (req, res) => {
  res.send('Use `npm run gmail-setup` in the backend to set up Gmail OAuth.');
});

module.exports = router;
