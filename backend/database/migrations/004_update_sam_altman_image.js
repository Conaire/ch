/**
 * Update Sam Altman's image to use local file
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    await db.query(
      `UPDATE models 
       SET image_url = '/images/sa.png' 
       WHERE lawyer_name = 'Sam Altman'`
    );
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query(
      `UPDATE models 
       SET image_url = 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop' 
       WHERE lawyer_name = 'Sam Altman'`
    );
  }
};

