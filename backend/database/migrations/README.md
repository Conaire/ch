# Database Migrations

This directory contains database migration files that are executed in alphabetical order.

## Creating a New Migration

1. Create a new file following the naming pattern: `XXX_description.js` (e.g., `002_add_users_table.js`)
2. Export an object with `up` and optionally `down` functions:

```javascript
module.exports = {
  up: async (db) => {
    // Migration code here
    // db is a mysql2 promise connection
    await db.query('USE ch');
    await db.query('CREATE TABLE ...');
  },

  down: async (db) => {
    // Rollback code here (optional)
    await db.query('USE ch');
    await db.query('DROP TABLE ...');
  }
};
```

## Running Migrations

From the `backend` directory:
```bash
npm run migrate
```

This will:
- Execute all pending migrations in order
- Skip already executed migrations
- Track executed migrations in the `migrations` table

## Migration Best Practices

- Always use `USE ch` at the start of your migration if you need to work with the database
- Use `IF NOT EXISTS` for table creation to make migrations idempotent
- Test your migrations on a development database first
- Keep migrations small and focused on a single change
- Never modify existing migration files after they've been run in production

