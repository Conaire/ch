/**
 * Add state column to transcript table to track which state each entry was created in
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    
    // Check if column already exists
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ch' 
      AND TABLE_NAME = 'transcript' 
      AND COLUMN_NAME = 'state'
    `);
    
    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE transcript 
        ADD COLUMN state VARCHAR(50) NULL AFTER role
      `);
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query('ALTER TABLE transcript DROP COLUMN state');
  }
};

