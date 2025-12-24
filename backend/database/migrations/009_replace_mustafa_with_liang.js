/**
 * Replace Mustafa Suleyman with Liang Wenfeng and update to DeepSeek
 */
module.exports = {
  up: async (db) => {
    await db.query('USE ch');
    await db.query(
      `UPDATE models 
       SET name = 'DeepSeek',
           company = 'DeepSeek',
           lawyer_name = 'Liang Wenfeng',
           lawyer_title = 'CEO of DeepSeek',
           description = 'Advanced AI model with deep learning capabilities',
           image_url = '/images/lw.png'
       WHERE lawyer_name = 'Mustafa Suleyman' OR name = 'Pi'`
    );
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query(
      `UPDATE models 
       SET name = 'Pi',
           company = 'Inflection AI',
           lawyer_name = 'Mustafa Suleyman',
           lawyer_title = 'CEO of Inflection AI',
           description = 'Personal AI assistant designed for conversation',
           image_url = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop'
       WHERE lawyer_name = 'Liang Wenfeng' OR name = 'DeepSeek'`
    );
  }
};

