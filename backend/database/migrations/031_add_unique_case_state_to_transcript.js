/**
 * Add unique constraint on case_id and state in transcript table
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    
    // Check if index already exists
    const [indexes] = await db.query(`
      SELECT INDEX_NAME 
      FROM INFORMATION_SCHEMA.STATISTICS 
      WHERE TABLE_SCHEMA = 'ch' 
      AND TABLE_NAME = 'transcript' 
      AND INDEX_NAME = 'idx_case_state_unique'
    `);
    
    if (indexes.length === 0) {
      await db.query(`
        ALTER TABLE transcript 
        ADD UNIQUE INDEX idx_case_state_unique (case_id, state)
      `);
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query('ALTER TABLE transcript DROP INDEX idx_case_state_unique');
  }
};

