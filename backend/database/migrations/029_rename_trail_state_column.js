/**
 * Rename trail_state column to trial_stage in cases table
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');

        await db.query(`
          ALTER TABLE cases 
          CHANGE COLUMN trial_stage trial_state VARCHAR(50) DEFAULT 'not_started'
        `);
    
  }
};

