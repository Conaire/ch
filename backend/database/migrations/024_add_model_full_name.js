/**
 * Add model_full_name column to models table
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    
    // Check if column already exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ch' 
      AND TABLE_NAME = 'models' 
      AND COLUMN_NAME = 'model_full_name'
    `);
    
    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE models 
        ADD COLUMN model_full_name VARCHAR(255) NULL AFTER name
      `);
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query('ALTER TABLE models DROP COLUMN model_full_name');
  }
};

