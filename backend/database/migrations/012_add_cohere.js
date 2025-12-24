/**
 * Add Cohere model
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    
    // Check if Cohere already exists
    const [existing] = await db.query('SELECT COUNT(*) as count FROM models WHERE name = ?', ['Cohere']);
    
    if (existing[0].count === 0) {
      await db.query(`
        INSERT INTO models (name, company, lawyer_name, lawyer_title, description, image_url) 
        VALUES ('Cohere', 'Cohere', 'Aidan Gomez', 'CEO of Cohere', 'Enterprise-focused AI platform with powerful language models', '/images/ag.png')
      `);
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query(`DELETE FROM models WHERE name = 'Cohere'`);
  }
};

