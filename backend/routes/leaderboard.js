const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Get leaderboard with win rates for each model
router.get('/', async (req, res) => {
  try {
    await db.query('USE ch');
    
    // Get all models
    const [models] = await db.query('SELECT id, name, company, image_url FROM models');
    
    // Get win/loss counts for each model
    // A model can be either model_1 (plaintiff) or model_2 (defendant)
    // winner=1 means plaintiff won, winner=2 means defendant won
    const [stats] = await db.query(`
      SELECT 
        m.id,
        m.name,
        m.company,
        m.image_url,
        COUNT(CASE WHEN (c.model_1 = m.id AND c.winner = 1) OR (c.model_2 = m.id AND c.winner = 2) THEN 1 END) as wins,
        COUNT(CASE WHEN (c.model_1 = m.id AND c.winner = 2) OR (c.model_2 = m.id AND c.winner = 1) THEN 1 END) as losses,
        COUNT(CASE WHEN c.model_1 = m.id OR c.model_2 = m.id THEN 1 END) as total_cases
      FROM models m
      LEFT JOIN cases c ON (c.model_1 = m.id OR c.model_2 = m.id) AND c.winner IS NOT NULL
      GROUP BY m.id, m.name, m.company, m.image_url
      ORDER BY wins DESC, total_cases DESC
    `);
    
    // Calculate win rate percentage
    const leaderboard = stats.map(model => ({
      id: model.id,
      name: model.name,
      company: model.company,
      image_url: model.image_url,
      wins: model.wins || 0,
      losses: model.losses || 0,
      total_cases: model.total_cases || 0,
      win_rate: model.total_cases > 0 
        ? Math.round((model.wins / model.total_cases) * 100) 
        : 0
    }));
    
    res.json(leaderboard);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

module.exports = router;

