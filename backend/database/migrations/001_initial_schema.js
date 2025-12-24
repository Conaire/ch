/**
 * Initial schema migration
 * Creates the database, models table, and seeds initial data
 */
module.exports = {
  up: async (db) => {
    // Create database if it doesn't exist
    await db.query('CREATE DATABASE IF NOT EXISTS ch');
    await db.query('USE ch');

    // Create migrations table to track which migrations have been run
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create models table
    await db.query(`
      CREATE TABLE IF NOT EXISTS models (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        company VARCHAR(255) NOT NULL,
        lawyer_name VARCHAR(255) NOT NULL,
        lawyer_title VARCHAR(255) NOT NULL,
        description TEXT,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Insert sample models (only if table is empty)
    const [existingModels] = await db.query('SELECT COUNT(*) as count FROM models');
    if (existingModels[0].count === 0) {
      await db.query(`
        INSERT INTO models (name, company, lawyer_name, lawyer_title, description, image_url) VALUES
        ('GPT-4', 'OpenAI', 'Sam Altman', 'CEO of OpenAI', 'Advanced language model with superior reasoning capabilities', '/images/sa.png'),
        ('Claude', 'Anthropic', 'Dario Amodei', 'CEO of Anthropic', 'Constitutional AI model focused on safety and helpfulness', '/images/da.png'),
        ('Gemini', 'Google', 'Sundar Pichai', 'CEO of Google', 'Multimodal AI model with advanced reasoning', '/images/sp.png'),
        ('Nova', 'Amazon', 'Jeff Bezos', 'CEO of Amazon', 'Next-generation AI assistant with deep knowledge', '/images/jb.png'),
        ('Grok', 'X', 'Elon Musk', 'CEO of X', 'Real-time AI with access to X platform data', '/images/em.png'),
        ('Llama', 'Meta', 'Mark Zuckerberg', 'CEO of Meta', 'Open-source large language model', '/images/mk.png'),
        ('Mistral', 'Mistral AI', 'Arthur Mensch', 'CEO of Mistral AI', 'Efficient and powerful open-source model', '/images/am.png'),
        ('DeepSeek', 'DeepSeek', 'Liang Wenfeng', 'CEO of DeepSeek', 'Advanced AI model with deep learning capabilities', '/images/lw.png'),
        ('Groq', 'Groq', 'Jonathan Ross', 'CEO of Groq', 'Ultra-fast inference AI with optimized performance', '/images/jr.png'),
        ('Cohere', 'Cohere', 'Aidan Gomez', 'CEO of Cohere', 'Enterprise-focused AI platform with powerful language models', '/images/ag.png')
      `);
    }
  },

  down: async (db) => {
    await db.query('USE ch');
    await db.query('DROP TABLE IF EXISTS models');
    await db.query('DROP TABLE IF EXISTS migrations');
  }
};

