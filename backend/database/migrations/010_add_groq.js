/**
 * Add Groq model
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    
    // Check if Groq already exists
    const [existing] = await db.query('SELECT COUNT(*) as count FROM models WHERE name = ?', ['Groq']);
    
    if (existing[0].count === 0) {
      await db.query(`
        INSERT INTO models (name, company, lawyer_name, lawyer_title, description, image_url) 
        VALUES ('Groq', 'Groq', 'Jonathan Ross', 'CEO of Groq', 'Ultra-fast inference AI with optimized performance', '/images/jr.png')
      `);
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query(`DELETE FROM models WHERE name = 'Groq'`);
  }
};

