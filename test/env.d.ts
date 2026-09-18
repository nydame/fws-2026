// Bindings that exist only in the test environment (see vitest.config.ts).
declare namespace Cloudflare {
	interface Env {
		/** The migrations/ directory, read by `readD1Migrations()` in Node. */
		TEST_MIGRATIONS: import('cloudflare:test').D1Migration[];
	}
}
