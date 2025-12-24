/**
 * Add model_1 and model_2 columns to cases table
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    
    // Check if columns already exist
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ch' 
      AND TABLE_NAME = 'cases' 
      AND COLUMN_NAME IN ('model_1', 'model_2')
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    if (!existingColumns.includes('model_1')) {
      await db.query(`
        ALTER TABLE cases 
        ADD COLUMN model_1 INT AFTER party_2
      `);
    }
    
    if (!existingColumns.includes('model_2')) {
      await db.query(`
        ALTER TABLE cases 
        ADD COLUMN model_2 INT AFTER model_1
      `);
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query('ALTER TABLE cases DROP COLUMN model_2');
    await db.query('ALTER TABLE cases DROP COLUMN model_1');
  }
};

