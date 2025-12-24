/**
 * Rename party_1 and party_2 to party_device_1 and party_device_2
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    
    // Check if new columns already exist
    const [columns] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ch' 
      AND TABLE_NAME = 'cases' 
      AND COLUMN_NAME IN ('party_device_1', 'party_device_2')
    `);
    
    const existingColumns = columns.map(col => col.COLUMN_NAME);
    
    // Rename party_1 to party_device_1 if it exists and new column doesn't
    if (!existingColumns.includes('party_device_1')) {
      const [oldCol] = await db.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'ch' 
        AND TABLE_NAME = 'cases' 
        AND COLUMN_NAME = 'party_1'
      `);
      
      if (oldCol.length > 0) {
        // Drop old index if it exists
        try {
          await db.query(`ALTER TABLE cases DROP INDEX idx_party_1`);
        } catch (error) {
          // Index doesn't exist, ignore
        }
        
        await db.query(`
          ALTER TABLE cases 
          CHANGE COLUMN party_1 party_device_1 VARCHAR(36)
        `);
        
        // Create new index
        await db.query(`CREATE INDEX idx_party_device_1 ON cases(party_device_1)`);
      } else {
        // Column doesn't exist, create it
        await db.query(`
          ALTER TABLE cases 
          ADD COLUMN party_device_1 VARCHAR(36) AFTER code
        `);
        await db.query(`CREATE INDEX idx_party_device_1 ON cases(party_device_1)`);
      }
    }
    
    // Rename party_2 to party_device_2 if it exists and new column doesn't
    if (!existingColumns.includes('party_device_2')) {
      const [oldCol] = await db.query(`
        SELECT COLUMN_NAME 
        FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = 'ch' 
        AND TABLE_NAME = 'cases' 
        AND COLUMN_NAME = 'party_2'
      `);
      
      if (oldCol.length > 0) {
        // Drop old index if it exists
        try {
          await db.query(`ALTER TABLE cases DROP INDEX idx_party_2`);
        } catch (error) {
          // Index doesn't exist, ignore
        }
        
        await db.query(`
          ALTER TABLE cases 
          CHANGE COLUMN party_2 party_device_2 VARCHAR(36)
        `);
        
        // Create new index
        await db.query(`CREATE INDEX idx_party_device_2 ON cases(party_device_2)`);
      } else {
        // Column doesn't exist, create it
        await db.query(`
          ALTER TABLE cases 
          ADD COLUMN party_device_2 VARCHAR(36) AFTER party_device_1
        `);
        await db.query(`CREATE INDEX idx_party_device_2 ON cases(party_device_2)`);
      }
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    
    // Rename back to original names
    const [cols] = await db.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'ch' 
      AND TABLE_NAME = 'cases' 
      AND COLUMN_NAME IN ('party_device_1', 'party_device_2')
    `);
    
    if (cols.find(c => c.COLUMN_NAME === 'party_device_1')) {
      try {
        await db.query(`ALTER TABLE cases DROP INDEX idx_party_device_1`);
      } catch (error) {
        // Index doesn't exist, ignore
      }
      await db.query(`ALTER TABLE cases CHANGE COLUMN party_device_1 party_1 VARCHAR(36)`);
      await db.query(`CREATE INDEX idx_party_1 ON cases(party_1)`);
    }
    
    if (cols.find(c => c.COLUMN_NAME === 'party_device_2')) {
      try {
        await db.query(`ALTER TABLE cases DROP INDEX idx_party_device_2`);
      } catch (error) {
        // Index doesn't exist, ignore
      }
      await db.query(`ALTER TABLE cases CHANGE COLUMN party_device_2 party_2 VARCHAR(36)`);
      await db.query(`CREATE INDEX idx_party_2 ON cases(party_2)`);
    }
  }
};

