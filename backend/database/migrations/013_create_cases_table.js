/**
 * Create cases table for multiplayer functionality
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    
    await db.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(6) NOT NULL UNIQUE,
        party_device_1 VARCHAR(36),
        party_device_2 VARCHAR(36),
        status VARCHAR(50) DEFAULT 'waiting',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_code (code),
        INDEX idx_party_device_1 (party_device_1),
        INDEX idx_party_device_2 (party_device_2)
      )
    `);
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query('DROP TABLE IF EXISTS cases');
  }
};

