/**
 * Add case_order column to transcript table to track message order
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
      AND COLUMN_NAME = 'case_order'
    `);
    
    // Add case_order column if it doesn't exist
    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE transcript
        ADD COLUMN case_order INT NOT NULL DEFAULT 0
      `);
      
      // Update existing records to have sequential order based on created_at
      // Use a temporary table approach to avoid MySQL update restriction
      await db.query(`
        UPDATE transcript t1
        INNER JOIN (
          SELECT id, 
                 ROW_NUMBER() OVER (PARTITION BY case_id ORDER BY created_at ASC) - 1 as rn
          FROM transcript
        ) t2 ON t1.id = t2.id
        SET t1.case_order = t2.rn
      `);
    }
    
    // Add index for better query performance (if it doesn't exist)
    try {
      await db.query(`
        CREATE INDEX idx_case_order ON transcript(case_id, case_order)
      `);
    } catch (error) {
      // Index might already exist, ignore
      if (!error.message.includes('Duplicate key name')) {
        throw error;
      }
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    
    // Drop index
    try {
      await db.query('DROP INDEX idx_case_order ON transcript');
    } catch (error) {
      // Index might not exist, ignore
    }
    
    // Drop column
    await db.query(`
      ALTER TABLE transcript
      DROP COLUMN case_order
    `);
  }
};

