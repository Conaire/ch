const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const stateMachine = require('../services/stateMachine');

// Generate a random 6-letter uppercase code
function generateCode() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  return code;
}

// Create a new case
router.post('/', async (req, res) => {
  try {
    const { partyId } = req.body;
    
    let code;
    let attempts = 0;
    const maxAttempts = 10;

    // Try to generate a unique code
    do {
      code = generateCode();
      const [existing] = await db.query('SELECT COUNT(*) as count FROM cases WHERE code = ?', [code]);
      if (existing[0].count === 0) {
        break;
      }
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return res.status(500).json({ error: 'Failed to generate unique code' });
    }

    // Generate UUID for case id
    const caseId = uuidv4();
    
    // Insert the new case with party_device_1 and trial_stage
    await db.query(
      'INSERT INTO cases (id, code, party_device_1, status, trial_state) VALUES (?, ?, ?, ?, ?)',
      [caseId, code, partyId || null, 'waiting', 'not_started']
    );

    res.json({ id: caseId, code, party_device_1: partyId, status: 'waiting' });
  } catch (error) {
    console.error('Error creating case:', error);
    res.status(500).json({ error: 'Failed to create case' });
  }
});

// Get case by code (auto-assign party_2 if not set and user is not party_1)
router.get('/:code', async (req, res) => {
  try {
    const { partyId } = req.query;
    const [rows] = await db.query('SELECT * FROM cases WHERE code = ?', [req.params.code]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    let caseData = rows[0];
    
    // Auto-assign party_device_2 if not set and user is not party_device_1
    // Also assign if user is party_device_2 but not yet in the case
    if (partyId && caseData.party_device_1 !== partyId) {
      if (!caseData.party_device_2) {
        // First time - assign party_device_2
        await db.query(
          'UPDATE cases SET party_device_2 = ? WHERE code = ? AND party_device_2 IS NULL',
          [partyId, req.params.code]
        );
        // Fetch updated case
        const [updated] = await db.query('SELECT * FROM cases WHERE code = ?', [req.params.code]);
        caseData = updated[0];
      } else if (caseData.party_device_2 !== partyId) {
        // party_device_2 is already assigned to someone else, but this user wants to use party_device_2
        // Allow it if they're using the same device_id
        // (This handles same-computer scenario)
      }
    }
    
    res.json(caseData);
  } catch (error) {
    console.error('Error fetching case:', error);
    res.status(500).json({ error: 'Failed to fetch case' });
  }
});

// Update case with model selection
router.patch('/:code/model', async (req, res) => {
  try {
    const { code } = req.params;
    const { partyId, modelId } = req.body;
    
    // Get the case
    const [cases] = await db.query('SELECT * FROM cases WHERE code = ?', [code]);
    if (cases.length === 0) {
      return res.status(404).json({ error: 'Case not found' });
    }
    
    const caseData = cases[0];
    let updateField = null;
    
    // Determine which party this is and which field to update
    // If model_1 is already set, always save to model_2 (defendant)
    if (caseData.model_1 !== null) {
      // Plaintiff has already selected, so this must be defendant selection
      updateField = 'model_2';
      // Always set party_device_2 if not already set (handles same device scenario)
      if (!caseData.party_device_2) {
        await db.query('UPDATE cases SET party_device_2 = ? WHERE code = ?', [partyId, code]);
      }
    } else if (caseData.party_device_1 === partyId) {
      // User is party_device_1 and model_1 is not set yet, so this is plaintiff selection
      updateField = 'model_1';
    } else {
      // First selection and user is not party_device_1, assign as party_device_1
      updateField = 'model_1';
      if (!caseData.party_device_1) {
        await db.query('UPDATE cases SET party_device_1 = ? WHERE code = ?', [partyId, code]);
      }
    }
    
    // Update the model selection
    await db.query(
      `UPDATE cases SET ${updateField} = ? WHERE code = ?`,
      [modelId, code]
    );
    
    console.log(`Saved ${updateField === 'model_1' ? 'plaintiff' : 'defendant'} model ${modelId} for case ${code}`);
    
    // If model_2 was just set, automatically select a random judge
    if (updateField === 'model_2') {
      // Get all models
      const [allModels] = await db.query('SELECT id FROM models');
      
      // Filter out model_1 and model_2
      const availableModels = allModels.filter(
        model => model.id !== caseData.model_1 && model.id !== modelId
      );
      
      if (availableModels.length > 0) {
        // Pick a random model from available ones
        const randomIndex = Math.floor(Math.random() * availableModels.length);
        const judgeModelId = availableModels[randomIndex].id;
        
        // Update the case with the judge model
        await db.query(
          'UPDATE cases SET judge_model = ? WHERE code = ?',
          [judgeModelId, code]
        );
        
        console.log(`Auto-selected judge model ${judgeModelId} for case ${code}`);

        await stateMachine.processStateMachine(caseData.id);

      }
    }
    
    // Return updated case
    const [updated] = await db.query('SELECT * FROM cases WHERE code = ?', [code]);
    res.json(updated[0]);
  } catch (error) {
    console.error('Error updating case model:', error);
    res.status(500).json({ error: 'Failed to update case model' });
  }
});

module.exports = router;

