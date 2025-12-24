/**
 * Add party_2 column to cases table
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
      AND COLUMN_NAME = 'party_2'
    `);
    
    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE cases 
        ADD COLUMN party_2 VARCHAR(36) AFTER party_1,
        ADD INDEX idx_party_2 (party_2)
      `);
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query('ALTER TABLE cases DROP COLUMN party_2');
  }
};

