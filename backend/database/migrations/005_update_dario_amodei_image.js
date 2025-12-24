/**
 * Update Dario Amodei's image to use local file
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    await db.query(
      `UPDATE models 
       SET image_url = '/images/da.png' 
       WHERE lawyer_name = 'Dario Amodei'`
    );
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query(
      `UPDATE models 
       SET image_url = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop' 
       WHERE lawyer_name = 'Dario Amodei'`
    );
  }
};

