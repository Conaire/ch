/**
 * Change cases and models id columns to VARCHAR(36) for UUIDs
 * Also update foreign key columns in cases table
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    
    // First, find and drop all foreign keys that reference these tables
    // Get foreign key names from cases table
    const [caseFks] = await db.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'ch' 
      AND TABLE_NAME = 'cases' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    for (const fk of caseFks) {
      try {
        await db.query(`
          ALTER TABLE cases 
          DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}
        `);
      } catch (error) {
        console.log(`Could not drop foreign key ${fk.CONSTRAINT_NAME}`);
      }
    }
    
    // Get foreign key names from transcript table
    const [transcriptFks] = await db.query(`
      SELECT CONSTRAINT_NAME 
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = 'ch' 
      AND TABLE_NAME = 'transcript' 
      AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    
    for (const fk of transcriptFks) {
      try {
        await db.query(`
          ALTER TABLE transcript 
          DROP FOREIGN KEY ${fk.CONSTRAINT_NAME}
        `);
      } catch (error) {
        console.log(`Could not drop foreign key ${fk.CONSTRAINT_NAME}`);
      }
    }
    
    // Change model_1, model_2, judge_model to VARCHAR(36) first
    await db.query(`
      ALTER TABLE cases 
      MODIFY COLUMN model_1 VARCHAR(36),
      MODIFY COLUMN model_2 VARCHAR(36),
      MODIFY COLUMN judge_model VARCHAR(36)
    `);
    
    // Change models.id to VARCHAR(36)
    // Remove AUTO_INCREMENT and change type
    await db.query(`
      ALTER TABLE models 
      MODIFY COLUMN id VARCHAR(36) NOT NULL
    `);
    
    // Step 2: Change cases.id from INT to VARCHAR(36)
    // Remove AUTO_INCREMENT and change type
    await db.query(`
      ALTER TABLE cases 
      MODIFY COLUMN id VARCHAR(36) NOT NULL
    `);
    
    // Step 3: Update transcript.case_id to VARCHAR(36)
    await db.query(`
      ALTER TABLE transcript 
      MODIFY COLUMN case_id VARCHAR(36) NOT NULL
    `);
    
    // Re-add foreign keys
    await db.query(`
      ALTER TABLE cases 
      ADD CONSTRAINT cases_ibfk_1 
      FOREIGN KEY (model_1) REFERENCES models(id) ON DELETE SET NULL
    `);
    
    await db.query(`
      ALTER TABLE cases 
      ADD CONSTRAINT cases_ibfk_2 
      FOREIGN KEY (model_2) REFERENCES models(id) ON DELETE SET NULL
    `);
    
    await db.query(`
      ALTER TABLE cases 
      ADD CONSTRAINT cases_ibfk_3 
      FOREIGN KEY (judge_model) REFERENCES models(id) ON DELETE SET NULL
    `);
    
    await db.query(`
      ALTER TABLE transcript 
      ADD CONSTRAINT transcript_ibfk_1 
      FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
    `);
  },

  down: async (db) => {
    await db.query('USE ch');
    
    // This is a complex rollback - would need to convert UUIDs back to INTs
    // For safety, we'll just note that this migration is not easily reversible
    // In production, you'd want to backup data before running this migration
    console.log('Warning: This migration is not easily reversible. Manual intervention required.');
  }
};

