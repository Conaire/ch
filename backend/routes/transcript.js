const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get transcript entries for a case
router.get('/case/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    console.log('Fetching transcript for case:', caseId);
    
    await db.query('USE ch');
    const [rows] = await db.query(
      'SELECT * FROM transcript WHERE case_id = ? ORDER BY case_order ASC, created_at ASC',
      [String(caseId)]
    );
    
    console.log('Found transcript entries:', rows.length);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching transcript:', error);
    console.error('Error details:', error.message);
    if (error.sql) {
      console.error('SQL error:', error.sql);
    }
    res.status(500).json({ error: 'Failed to fetch transcript', details: error.message });
  }
});

// Add party response
router.post('/', async (req, res) => {
  try {
    const { caseId, role, content } = req.body;
    
    console.log('Adding party response:', { caseId, role, contentLength: content?.length });
    
    if (!caseId || !role || !content) {
      return res.status(400).json({ error: 'Missing required fields: caseId, role, content' });
    }
    
    if (!['party_1', 'party_2'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Must be party_1 or party_2' });
    }
    
    await db.query('USE ch');
    
    // Get the current trial_state from the case
    const [caseRows] = await db.query(
      'SELECT trial_state FROM cases WHERE id = ?',
      [String(caseId)]
    );
    const currentState = caseRows[0]?.trial_state || null;
    
    // Get the next case_order value for this case
    const [maxOrderRows] = await db.query(
      'SELECT MAX(case_order) as max_order FROM transcript WHERE case_id = ?',
      [String(caseId)]
    );
    const nextOrder = (maxOrderRows[0]?.max_order ?? -1) + 1;
    
    const id = uuidv4();
    
    // Insert the party response into transcript with state
    await db.query(
      'INSERT INTO transcript (id, case_id, role, state, content, case_order) VALUES (?, ?, ?, ?, ?, ?)',
      [id, String(caseId), role, currentState, content.trim(), nextOrder]
    );
    
    console.log('Party response added to transcript with id:', id, 'order:', nextOrder);
    
    // Call state machine service to process state transitions
    
    // Fetch the newly created entry
    const [rows] = await db.query('SELECT * FROM transcript WHERE id = ?', [id]);
    
    res.json({
      success: true,
      entry: rows[0]
    });
  } catch (error) {
    console.error('Error adding party response:', error);
    console.error('Error details:', error.message);
    if (error.sql) {
      console.error('SQL error:', error.sql);
    }
    res.status(500).json({ error: 'Failed to add party response', details: error.message });
  }
});

module.exports = router;

