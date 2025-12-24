const express = require('express');
const router = express.Router();
const { processStateMachine, STATES } = require('../services/stateMachine');

// Get all states
router.get('/states', (req, res) => {
  res.json(STATES);
});

// Process state machine for a case
router.post('/:caseId', async (req, res) => {
  try {
    const { caseId } = req.params;
    console.log('=== STATE MACHINE ROUTE CALLED ===');
    console.log('Processing state machine for case:', caseId);
    console.log('Request body:', req.body);
    
    const result = await processStateMachine(caseId);
    
    console.log('State machine result:', JSON.stringify(result, null, 2));
    console.log('=== STATE MACHINE ROUTE COMPLETE ===');
    
    res.json(result);
  } catch (error) {
    console.error('=== STATE MACHINE ERROR ===');
    console.error('Error processing state machine:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      error: 'Failed to process state machine', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

