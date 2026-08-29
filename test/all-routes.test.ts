import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

// Enumerates every route the build actually produced, from the built
// artifact, so a route added by a later ticket is covered the day its page
// is added — no per-page test to write.
//
// `import.meta.glob` is resolved by Vite at transform time (outside the
// workerd sandbox the test body runs in), which is what lets a plain
// filesystem listing reach a test that otherwise only has `SELF.fetch()` —
// workerd's nodejs_compat `fs` shim only sees a mounted subset of the real
// filesystem and can't reliably `readdir` an arbitrary absolute host path.
const htmlModules = import.meta.glob('/dist/client/**/*.html');
const DIST_CLIENT_PREFIX = '/dist/client/';

// 404.html is not itself a route — it's what an unmatched route resolves to
// (see wrangler.jsonc's `assets.not_found_handling`) — so it's tested
// separately, by requesting a path that doesn't exist.
function routeForHtmlFile(modulePath: string): string | null {
	const relPath = modulePath.slice(DIST_CLIENT_PREFIX.length);
	if (relPath === '404.html') return null;

	if (relPath === 'index.html') return '/';
	if (relPath.endsWith('/index.html')) return `/${relPath.slice(0, -'index.html'.length)}`;
	return `/${relPath}`;
}

const routes = Object.keys(htmlModules)
	.map(routeForHtmlFile)
	.filter((route): route is string => route !== null)
	.sort();

function countH1s(html: string): number {
	return (html.match(/<h1[\s>]/gi) ?? []).length;
}

describe('all-routes sweep', () => {
	it('found at least the home route in the build output', () => {
		expect(routes).toContain('/');
	});

	it.each(routes)('%s responds 200 and renders exactly one <h1>', async (route) => {
		const response = await SELF.fetch(new URL(route, 'https://example.com/'));
		expect(response.status).toBe(200);
		expect(countH1s(await response.text())).toBe(1);
	});

	it('an unknown route is served as a 404 with exactly one <h1>', async () => {
		const response = await SELF.fetch('https://example.com/this-route-does-not-exist/');
		expect(response.status).toBe(404);
		expect(countH1s(await response.text())).toBe(1);
	});
});
