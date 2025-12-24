/**
 * Fix existing cases with empty string IDs by generating UUIDs
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    
    // Get all cases with empty or null IDs
    const [cases] = await db.query(`
      SELECT id, code FROM cases 
      WHERE id IS NULL OR id = '' OR id = '0'
    `);
    
    console.log(`Found ${cases.length} cases with empty IDs to fix`);
    
    // Import uuid
    const { v4: uuidv4 } = require('uuid');
    
    for (const caseRow of cases) {
      const newId = uuidv4();
      console.log(`Updating case ${caseRow.code} with new ID: ${newId}`);
      
      // Update the case with the new UUID
      await db.query(
        'UPDATE cases SET id = ? WHERE code = ?',
        [newId, caseRow.code]
      );
      
      // Also update any transcript entries that might reference this case by code
      // (though transcript should use case_id, not code)
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    // This migration is not easily reversible
    console.log('Warning: Cannot reverse UUID assignment migration');
  }
};

