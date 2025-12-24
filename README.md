# AI Courthouse

An AI courthouse application where you select an AI model and have a court case. The lawyer for each model is represented by the CEO of the company (e.g., Elon Musk for X/Grok, Jeff Bezos for Amazon/Nova).

## Project Structure

- `backend/` - Node.js/Express backend
- `src/` - Vue.js frontend

## Setup Instructions

### Backend Setup

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend folder:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ch
PORT=3000
```

4. Run database migrations:
   ```bash
   npm run migrate
   ```
   This will create the database, tables, and seed initial data automatically.

5. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3000`

### Frontend Setup

1. Install dependencies (from project root):
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## Features

- **Model Picker**: Game-style drafting screen to select your AI model
- Each model is represented with its company CEO as the lawyer
- Beautiful, modern UI with game-inspired design

## Database Migrations

The project uses a migration system to manage database schema changes.

### Running Migrations

To run all pending migrations:
```bash
cd backend
npm run migrate
```

This will:
- Create the `ch` database if it doesn't exist
- Create all necessary tables
- Seed initial data (AI models)
- Track which migrations have been executed

### Migration Files

Migrations are stored in `backend/database/migrations/` and are executed in alphabetical order. Each migration file exports:
- `up`: Function to apply the migration
- `down`: Function to rollback the migration (optional)

### Database Schema

The MySQL database `ch` contains:
- `migrations` table: Tracks executed migrations
- `models` table: Contains AI models with the following structure:
  - id
  - name (e.g., GPT-4, Claude, Gemini)
  - company (e.g., OpenAI, Anthropic, Google)
  - lawyer_name (e.g., Sam Altman, Dario Amodei, Sundar Pichai)
  - lawyer_title (e.g., CEO of OpenAI)
  - description
  - image_url
  - created_at
  - updated_at

