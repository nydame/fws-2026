import { resolve } from 'node:path';
import { buildPagesASSETSBinding, cloudflareTest } from '@cloudflare/vitest-pool-workers';
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
 */
function builtSite(name: string, distClient: string, include: string[]) {
	return defineProject({
		test: { name, include, exclude },
		plugins: [
			cloudflareTest(async () => ({
				// The site is fully prerendered right now, so the build has no worker
				// script of its own for `SELF` to bind to (see test/self-fetch-worker.ts).
				main: './test/self-fetch-worker.ts',
				wrangler: { configPath: `${distClient}/wrangler.json` },
				// A real static deploy has no worker at all, so Wrangler never emits an
				// ASSETS binding for one (see dist/client/wrangler.json after a build).
				// `buildPagesASSETSBinding` reconstructs the same fetcher Wrangler wires
				// up for a Pages Functions worker, purely so the test worker above has
				// something to bind to.
				miniflare: {
					serviceBindings: { ASSETS: await buildPagesASSETSBinding(resolve(distClient)) },
				},
			})),
		],
	});
}

export default defineConfig({
	test: {
		projects: [
			// The site as it ships, whatever its real content happens to be.
			builtSite('site', './dist/client', ['test/*.test.ts']),
			// The same site built against each fixture set in test/fixtures/. One
			// static build can only be in one branch of /blog/, so each branch gets
			// a build of its own and stays covered after the first Post ships.
			// Built by `pnpm build:blog-fixtures`.
			builtSite('blog-empty', './dist-blog-empty/client', ['test/blog-fixture-builds/empty.test.ts']),
			builtSite('blog-listing', './dist-blog-listing/client', ['test/blog-fixture-builds/listing.test.ts']),
		],
	},
});
