/**
 * Update trial_stage default from 'into' to 'not_started'
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    
    // Check if column exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ch' 
      AND TABLE_NAME = 'cases' 
      AND COLUMN_NAME = 'trial_stage'
    `);
    
    if (columns.length > 0) {
      // Update any existing cases with 'into' to 'not_started'
      await db.query(`
        UPDATE cases 
        SET trial_stage = 'not_started' 
        WHERE trial_stage = 'into' OR trial_stage IS NULL
      `);
      
      // Change the default value
      await db.query(`
        ALTER TABLE cases 
        ALTER COLUMN trial_stage SET DEFAULT 'not_started'
      `);
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    // Revert to 'into' if needed
    await db.query(`
      UPDATE cases 
      SET trial_stage = 'into' 
      WHERE trial_stage = 'not_started'
    `);
    await db.query(`
      ALTER TABLE cases 
      ALTER COLUMN trial_stage SET DEFAULT 'into'
    `);
  }
};

