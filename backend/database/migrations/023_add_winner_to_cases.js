/**
 * Add winner column to cases table
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    
    // Check if column already exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ch' 
      AND TABLE_NAME = 'cases' 
      AND COLUMN_NAME = 'winner'
    `);
    
    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE cases 
        ADD COLUMN winner INT NULL AFTER judge_model,
        ADD CONSTRAINT chk_winner CHECK (winner IN (1, 2))
      `);
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query('ALTER TABLE cases DROP COLUMN winner');
  }
};

