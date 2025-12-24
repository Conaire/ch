const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

// Create connection without specifying database (to create it if needed)
async function createConnection() {
  return mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true
  });
}

async function getExecutedMigrations(db) {
  try {
    // Try to use the database
    await db.query('USE ch');
    // Try to query migrations table
    const [rows] = await db.query('SELECT name FROM migrations ORDER BY id');
    return rows.map(row => row.name);
  } catch (error) {
    // Database or migrations table doesn't exist yet - this is fine for first run
    if (error.code === 'ER_BAD_DB_ERROR' || error.code === 'ER_NO_SUCH_TABLE') {
      return [];
    }
    // Re-throw other errors
    throw error;
  }
}

async function markMigrationAsExecuted(db, migrationName) {
  try {
    await db.query('USE ch');
    await db.query('INSERT INTO migrations (name) VALUES (?)', [migrationName]);
  } catch (error) {
    console.error(`Error marking migration as executed: ${error.message}`);
    throw error;
  }
}

async function runMigrations() {
  let connection;
  
  try {
    connection = await createConnection();
    console.log('Connected to MySQL server');

    // Get list of migration files
    const files = fs.readdirSync(MIGRATIONS_DIR)
      .filter(file => file.endsWith('.js'))
      .sort();

    if (files.length === 0) {
      console.log('No migration files found');
      return;
    }

    // Get already executed migrations
    const executedMigrations = await getExecutedMigrations(connection);
    console.log(`Found ${executedMigrations.length} executed migrations`);

    // Run pending migrations
    let executedCount = 0;
    for (const file of files) {
      const migrationName = path.basename(file, '.js');
      
      if (executedMigrations.includes(migrationName)) {
        console.log(`⏭️  Skipping ${migrationName} (already executed)`);
        continue;
      }

      console.log(`🔄 Running migration: ${migrationName}`);
      
      try {
        const migration = require(path.join(MIGRATIONS_DIR, file));
        
        if (!migration.up) {
          throw new Error('Migration must export an "up" function');
        }

        // Run the migration
        await migration.up(connection);
        
        // Mark as executed
        await markMigrationAsExecuted(connection, migrationName);
        
        console.log(`✅ Successfully executed: ${migrationName}`);
        executedCount++;
      } catch (error) {
        console.error(`❌ Error running migration ${migrationName}:`, error.message);
        throw error;
      }
    }

    if (executedCount === 0) {
      console.log('✨ All migrations are up to date!');
    } else {
      console.log(`\n✨ Successfully executed ${executedCount} migration(s)`);
    }

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migrations if this script is executed directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      console.log('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Migration process failed:', error);
      process.exit(1);
    });
}

module.exports = { runMigrations };

