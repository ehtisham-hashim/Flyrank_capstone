import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './pool.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const client = await pool.connect();
  try {
    console.log('[DB] Starting migrations...');
    await client.query('BEGIN');

    // Create schema_migrations tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(255) PRIMARY KEY,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

    for (const file of files) {
      const res = await client.query('SELECT 1 FROM schema_migrations WHERE version = $1', [file]);
      if (res.rowCount === 0) {
        console.log(`[DB] Applying migration: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [file]);
      } else {
        console.log(`[DB] Skipping already applied migration: ${file}`);
      }
    }

    await client.query('COMMIT');
    console.log('[DB] Migrations completed successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[DB] Migration error:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
