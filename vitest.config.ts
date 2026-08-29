// @ts-check
import { resolve } from 'node:path';
import { buildPagesASSETSBinding, cloudflareTest } from '@cloudflare/vitest-pool-workers';
import { defineConfig } from 'vitest/config';

// Tests run against the built assets and bindings, not the source config, so
// the suite exercises the same artifact `wrangler deploy` would ship. Run
// `pnpm build` before `pnpm test`.
export default defineConfig({
	plugins: [
		cloudflareTest(async () => ({
			// The site is fully prerendered right now, so the build has no worker
			// script of its own for `SELF` to bind to (see test/self-fetch-worker.ts).
			main: './test/self-fetch-worker.ts',
			wrangler: { configPath: './dist/client/wrangler.json' },
			// A real static deploy has no worker at all, so Wrangler never emits an
			// ASSETS binding for one (see dist/client/wrangler.json after a build).
			// `buildPagesASSETSBinding` reconstructs the same fetcher Wrangler wires
			// up for a Pages Functions worker, purely so the test worker above has
			// something to bind to.
			miniflare: {
				serviceBindings: {
					ASSETS: await buildPagesASSETSBinding(resolve('./dist/client')),
				},
			},
		})),
	],
});
