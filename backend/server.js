const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const db = require('./config/database');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/models', require('./routes/models'));
app.use('/api/cases', require('./routes/cases'));
app.use('/api/transcript', require('./routes/transcript'));
app.use('/api/state-machine', require('./routes/stateMachine'));
app.use('/api/leaderboard', require('./routes/leaderboard'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'AI Courthouse API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

