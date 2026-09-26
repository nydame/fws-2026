import { applyD1Migrations, env } from 'cloudflare:test';

// Brings the local D1 up to the schema in migrations/, the same files
// `wrangler d1 migrations apply` runs against the real database. Setup files
// run before every test file; already-applied migrations are skipped.
await applyD1Migrations(env.DB, env.TEST_MIGRATIONS);
