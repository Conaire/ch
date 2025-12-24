-- Create database
CREATE DATABASE IF NOT EXISTS ch;
USE ch;

-- Create models table
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
);

-- Insert sample models
INSERT INTO models (name, company, lawyer_name, lawyer_title, description, image_url) VALUES
('GPT-4', 'OpenAI', 'Sam Altman', 'CEO of OpenAI', 'Advanced language model with superior reasoning capabilities', 'https://via.placeholder.com/300x300?text=GPT-4'),
('Claude', 'Anthropic', 'Dario Amodei', 'CEO of Anthropic', 'Constitutional AI model focused on safety and helpfulness', 'https://via.placeholder.com/300x300?text=Claude'),
('Gemini', 'Google', 'Sundar Pichai', 'CEO of Google', 'Multimodal AI model with advanced reasoning', 'https://via.placeholder.com/300x300?text=Gemini'),
('Nova', 'Amazon', 'Jeff Bezos', 'CEO of Amazon', 'Next-generation AI assistant with deep knowledge', 'https://via.placeholder.com/300x300?text=Nova'),
('Grok', 'X', 'Elon Musk', 'CEO of X', 'Real-time AI with access to X platform data', 'https://via.placeholder.com/300x300?text=Grok'),
('Llama', 'Meta', 'Mark Zuckerberg', 'CEO of Meta', 'Open-source large language model', 'https://via.placeholder.com/300x300?text=Llama'),
('Mistral', 'Mistral AI', 'Arthur Mensch', 'CEO of Mistral AI', 'Efficient and powerful open-source model', 'https://via.placeholder.com/300x300?text=Mistral'),
('Pi', 'Inflection AI', 'Mustafa Suleyman', 'CEO of Inflection AI', 'Personal AI assistant designed for conversation', 'https://via.placeholder.com/300x300?text=Pi');

