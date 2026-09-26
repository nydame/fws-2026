// Every route the build actually produced, read from the built artifact, so a
// route added by a later ticket is covered the day its page is added — no
// per-page test to write.
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

export const builtRoutes: string[] = Object.keys(htmlModules)
	.map(routeForHtmlFile)
	.filter((route): route is string => route !== null)
	.sort();

/** A path the build matches nothing for, so requesting it renders the 404 page. */
export const MISSING_ROUTE = '/this-route-does-not-exist/';

/**
 * Every page the site renders to a GET: its routes, plus the 404 an unmatched
 * path resolves to. A sweep meant to cover the whole site wants this one —
 * the 404 is a page a visitor sees, and it is built from the same layout.
 */
export const renderedRoutes: string[] = [...builtRoutes, MISSING_ROUTE];
