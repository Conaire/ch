/**
 * Update Sundar Pichai's image to use local file
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    await db.query(
      `UPDATE models 
       SET image_url = '/images/sp.png' 
       WHERE lawyer_name = 'Sundar Pichai'`
    );
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query(
      `UPDATE models 
       SET image_url = 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop' 
       WHERE lawyer_name = 'Sundar Pichai'`
    );
  }
};

