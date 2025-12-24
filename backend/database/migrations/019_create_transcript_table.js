/**
 * Create transcript table for trial mechanics
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS transcript (
        id VARCHAR(36) PRIMARY KEY,
        case_id INT NOT NULL,
        role VARCHAR(20) NOT NULL,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_case_id (case_id),
        INDEX idx_role (role),
        FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
      )
    `);
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query('DROP TABLE IF EXISTS transcript');
  }
};

