/**
 * Add trial_stage column to cases table
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
      AND COLUMN_NAME = 'trial_stage'
    `);
    
    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE cases 
        ADD COLUMN trial_stage VARCHAR(50) DEFAULT 'not_started' AFTER judge_model
      `);
      
      // Set default value for existing cases
      await db.query(`
        UPDATE cases 
        SET trial_stage = 'not_started' 
        WHERE trial_stage IS NULL
      `);
    } else {
      // If column exists but might have old default, update existing cases with 'into' to 'not_started'
      await db.query(`
        UPDATE cases 
        SET trial_stage = 'not_started' 
        WHERE trial_stage = 'into' OR trial_stage IS NULL
      `);
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query('ALTER TABLE cases DROP COLUMN trial_stage');
  }
};

