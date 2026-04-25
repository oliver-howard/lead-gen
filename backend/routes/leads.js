const express = require('express');
const router = express.Router();
const supabase = require('../db/supabase');

// GET /api/leads
router.get('/', async (req, res) => {
  const { status, search } = req.query;
  let query = supabase.from('leads').select('*').order('lead_score', { ascending: false });
  if (status && status !== 'all') query = query.eq('status', status);
  if (search) query = query.ilike('name', `%${search}%`);
  const { data, error } = await query;
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// PATCH /api/leads/:id
router.patch('/:id', async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('leads').update(req.body).eq('id', id).select().single();
  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

// POST /api/leads/bulk-status
router.post('/bulk-status', async (req, res) => {
  const { ids, status } = req.body;
  if (!ids || !Array.isArray(ids) || !status) {
    return res.status(400).json({ error: 'ids (array) and status are required' });
  }

  const { data, error } = await supabase
    .from('leads')
    .update({ status })
    .in('id', ids)
    .select();

  if (error) return res.status(500).json({ error: error.message });
  return res.json(data);
});

module.exports = router;

