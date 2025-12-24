const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { generateQuestion, generateClosingStatement, generateVerdict } = require('./aiService');
const e = require('express');

// Helper to save a transcript item (ignores duplicate case_id + state)
async function saveTranscriptItem(caseId, role, state, content, caseOrder) {
  const messageId = uuidv4();
  const [result] = await db.query(
    'INSERT IGNORE INTO transcript (id, case_id, role, state, content, case_order) VALUES (?, ?, ?, ?, ?, ?)',
    [messageId, String(caseId), role, state, content, caseOrder]
  );
  if (result.affectedRows > 0) {
    console.log(`[StateMachine] Saved transcript item: ${state} (${role})`);
    return messageId;
  } else {
    console.log(`[StateMachine] Skipped duplicate transcript item: ${state} (${role})`);
    return null;
  }
}

// Ordered states; each (except not_started) requires a transcript entry.
// If ai=true, the entry is generated via aiService; otherwise the UI collects it from the user.
// requiredCount is the minimum number of entries for that role to consider the state complete.
const STATES = [
  { name: 'not_started', ai: true },
  { name: 'request_complaint', role: 'judge', ai: true,  prompt: 'What is your complaint?' },
  { name: 'complaint', role: 'party_1', ai: false  },
  { name: 'request_defense', role: 'judge', ai: true,  prompt: 'What is your defense?' },
  { name: 'defense', role: 'party_2', ai: false },
  { name: 'request_cross', role: 'judge', ai: true, prompt: 'Please cross reference' },
  { name: 'q1', role: 'party_1', ai: true, generator: 'question' },
  { name: 'q1_response', role: 'party_2', ai: false },
  { name: 'q2', role: 'party_2', ai: true, generator: 'question' },
  { name: 'q2_response', role: 'party_1', ai: false },
  { name: 'q3', role: 'party_1', ai: true, generator: 'question' },
  { name: 'q3_response', role: 'party_2', ai: false },
  { name: 'q4', role: 'party_2', ai: true, generator: 'question' },
  { name: 'q4_response', role: 'party_1', ai: false },
  { name: 'q1_closing', role: 'party_1', ai: true, generator: 'closing_statement' },
  { name: 'q2_closing', role: 'party_2', ai: true, generator: 'closing_statement' },
  { name: 'verdict', role: 'judge', ai: true, generator: 'verdict'}
];



async function processStateMachine(caseId) {
  try {
    console.log(`[StateMachine] Processing case: ${caseId}`);
    await db.query('USE ch');

    const [caseRows] = await db.query(
      'SELECT * FROM cases WHERE id = ?',
      [String(caseId)]
    );
    if (!caseRows.length) throw new Error('Case not found');

    const caseData = caseRows[0];
    console.log(`[StateMachine] Case found, trial_state: ${caseData.trial_state}`);

    const [transcriptRows] = await db.query(
      'SELECT * FROM transcript WHERE case_id = ? ORDER BY case_order ASC, created_at ASC',
      [String(caseId)]
    );
    console.log(`[StateMachine] Transcript entries: ${transcriptRows.length}`);

    let maxOrder = transcriptRows.map(t => t.case_order).reduce((a, b) => Math.max(a, b), 0);
    let nextOrder = maxOrder;

    // Use trial_state column from cases
    const currentStage = caseData.trial_state || 'not_started';
    console.log(`[StateMachine] Current stage: ${currentStage}`);
    
    let currentIndex = STATES.findIndex((s) => s.name === currentStage);
    if (currentIndex === -1) {
      console.warn(`[StateMachine] Unknown stage "${currentStage}" for case ${caseId}`);
      return { stateTransitioned: false, currentStage, messageAdded: false };
    }

    let loopCurrentDef = STATES[currentIndex];

    const [existingRows] = await db.query(
        'SELECT id FROM transcript WHERE case_id = ? AND state = ?',
        [String(caseId), loopCurrentDef.name]
    );

    if(existingRows.length > 0 || loopCurrentDef.name === 'not_started'){
      loopCurrentDef = STATES[currentIndex + 1];
    }


    while (loopCurrentDef && loopCurrentDef.ai) {

        // Check if transcript item already exists for this case and state
        const [existingRows] = await db.query(
            'SELECT id FROM transcript WHERE case_id = ? AND state = ?',
            [String(caseId), loopCurrentDef.name]
        );
        
  

        nextOrder++;
        let content = null;

        if (loopCurrentDef.prompt) {
            // Static prompt (e.g., intro)
            content = loopCurrentDef.prompt;
            console.log('doing prompt');
        } else if (loopCurrentDef.generator === 'verdict') {
            // Generate AI verdict - first char is winner (1 or 2)
            const verdictResult = await generateVerdict(transcriptRows);
            const winner = verdictResult.charAt(0);
            content = verdictResult.substring(1).trim();
            
            // Update case winner
            if (winner === '1' || winner === '2') {
                await db.query(
                    'UPDATE cases SET winner = ? WHERE id = ?',
                    [parseInt(winner), String(caseId)]
                );
                console.log(`[StateMachine] Updated case winner to: ${winner}`);
            }
        } else if(loopCurrentDef.generator === 'question') {
            // Generate AI cross-examination question
            content = await generateQuestion(transcriptRows, loopCurrentDef.role);
        } else if(loopCurrentDef.generator === 'closing_statement') {
            // Generate AI closing statement
            content = await generateClosingStatement(transcriptRows, loopCurrentDef.role);
        }

        if(content){
            await saveTranscriptItem(caseId, loopCurrentDef.role, loopCurrentDef.name, content, nextOrder);
            anyMessageAdded = true;
        }

     
        loopCurrentDef = STATES[currentIndex += 1];

        if (loopCurrentDef) {
            console.log(`[StateMachine] moving to ${loopCurrentDef.name}`);
            await db.query(
                'UPDATE cases SET trial_state = ? WHERE id = ?',
                [loopCurrentDef.name, String(caseId)]
            );
        }    
     
    }
  } catch (error) {
    console.error('Error in state machine:', error);
    throw error;
  }
}

module.exports = {
  processStateMachine,
  STATES
};

