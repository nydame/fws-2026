import { resolve } from 'node:path';
import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-pool-workers';
import { defineConfig, defineProject } from 'vitest/config';

// Tests run against the built assets and bindings, not the source config, so
// the suite exercises the same artifact `wrangler deploy` would ship. Run
// `pnpm build` before `pnpm test` — or just `pnpm test`, which builds first.

// `exclude` replaces Vitest's defaults rather than extending them, so
// node_modules and dist have to be restated. The third entry keeps stale
// git worktrees out: Vitest does not read .gitignore, so a worktree's own
// copy of test/ is otherwise collected and run against this build's dist.
const exclude = ['**/node_modules/**', '**/dist/**', '**/.claude/worktrees/**'];

/**
 * A project that serves one build of the site through workerd, so its tests
 * reach it the only way the suite is allowed to: `SELF.fetch()`.
 *
 * `SELF` is the worker Astro's Cloudflare adapter emits — the same script and
 * ASSETS binding `wrangler deploy` ships — because the Client Inquiry
 * endpoint makes the build a real worker rather than static files alone.
 */
function builtSite(name: string, distDir: string, include: string[]) {
	return defineProject({
		test: { name, include, exclude, setupFiles: ['./test/apply-migrations.ts'] },
		plugins: [
			cloudflareTest(async () => ({
				wrangler: { configPath: `${distDir}/server/wrangler.json` },
				miniflare: {
					bindings: {
						// Applied to the local D1 by test/apply-migrations.ts.
						TEST_MIGRATIONS: await readD1Migrations(resolve('./migrations')),
						// Never sent anywhere: test/turnstile.ts answers siteverify itself.
						TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
						// Never sent anywhere either: test/resend.ts answers Resend itself.
						RESEND_API_KEY: 'test-resend-key',
						INQUIRY_NOTIFICATION_FROM: 'Inquiries <inquiries@example.com>',
						INQUIRY_NOTIFICATION_TO: 'practitioner@example.com',
					},
				},
			})),
		],
	});
}

export default defineConfig({
	test: {
		projects: [
			// The site as it ships, whatever its real content happens to be.
			builtSite('site', './dist', ['test/*.test.ts']),
			// The same site built against each fixture set in test/fixtures/. One
			// static build can only be in one branch of /blog/, so each branch gets
			// a build of its own and stays covered after the first Post ships.
			// Built by `pnpm build:blog-fixtures`.
			builtSite('blog-empty', './dist-blog-empty', ['test/blog-fixture-builds/empty.test.ts']),
			builtSite('blog-listing', './dist-blog-listing', ['test/blog-fixture-builds/listing.test.ts']),
		],
	},
});
