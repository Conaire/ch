const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get all models
router.get('/', async (req, res) => {
  try {
    await db.query('USE ch');
    const [rows] = await db.query('SELECT * FROM models ORDER BY id');
    console.log(`Fetched ${rows.length} models`);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching models:', error);
    console.error('Error details:', error.message);
    if (error.sql) {
      console.error('SQL error:', error.sql);
    }
    res.status(500).json({ error: 'Failed to fetch models', details: error.message });
  }
});

// Get single model by ID
router.get('/:id', async (req, res) => {
  try {
    await db.query('USE ch');
    const [rows] = await db.query('SELECT * FROM models WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Model not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching model:', error);
    console.error('Error details:', error.message);
    if (error.sql) {
      console.error('SQL error:', error.sql);
    }
    res.status(500).json({ error: 'Failed to fetch model', details: error.message });
  }
});

module.exports = router;

