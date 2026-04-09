import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIGRATIONS_DIR = path.join(__dirname, 'migrations');

const MIGRATIONS_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS schema_migrations (
    version   text PRIMARY KEY,
    name      text NOT NULL,
    applied_at timestamptz DEFAULT now()
  );
`;

async function getAppliedVersions(pool) {
  const res = await pool.query('SELECT version FROM schema_migrations ORDER BY version ASC');
  return new Set(res.rows.map(r => r.version));
}

function loadMigrationFiles() {
  if (!fs.existsSync(MIGRATIONS_DIR)) {
    fs.mkdirSync(MIGRATIONS_DIR, { recursive: true });
  }

  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()
    .map(filename => {
      const [version, ...nameParts] = filename.replace('.sql', '').split('_');
      return {
        version,
        name: nameParts.join('_'),
        filename,
        sql: fs.readFileSync(path.join(MIGRATIONS_DIR, filename), 'utf8'),
      };
    });
}

export async function runMigrations(pool) {
  await pool.query(MIGRATIONS_TABLE_SQL);

  const applied = await getAppliedVersions(pool);
  const files = loadMigrationFiles();
  const pending = files.filter(m => !applied.has(m.version));

  if (pending.length === 0) {
    console.log('[DB] Schema is up to date.');
    return;
  }

  console.log(`[DB] Running ${pending.length} pending migration(s)...`);

  for (const migration of pending) {
    try {
      await pool.query('BEGIN');
      await pool.query(migration.sql);
      await pool.query(
        'INSERT INTO schema_migrations (version, name) VALUES ($1, $2)',
        [migration.version, migration.name]
      );
      await pool.query('COMMIT');
      console.log(`[DB] Applied migration: ${migration.filename}`);
    } catch (err) {
      await pool.query('ROLLBACK');
      console.error(`[DB] Migration failed: ${migration.filename}`, err.message);
      throw new Error(`Migration ${migration.filename} failed: ${err.message}`);
    }
  }

  console.log('[DB] All migrations applied successfully.');
}
