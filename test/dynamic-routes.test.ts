import { describe, expect, it } from 'vitest';

// The site stays prerendered; exactly one route — the endpoint that receives
// a Client Inquiry — opts out (docs/adr/0001-client-inquiry-pipeline.md).
// Read from source because "which routes are dynamic" is a property of the
// code, and a second dynamic route is exactly what this guards against.
const pages = import.meta.glob('/src/pages/**/*.{astro,ts,js,md,mdx}', {
	eager: true,
	query: '?raw',
	import: 'default',
}) as Record<string, string>;

const OPTS_OUT = /export\s+const\s+prerender\s*=\s*false\b/;

// The worker config the build actually ships, so bindings the adapter injects
// on its own are visible too.
const builtWorker = Object.values(
	import.meta.glob('/dist/server/wrangler.json', { eager: true, import: 'default' }),
)[0] as Record<string, unknown> | undefined;

/**
 * Every binding a worker config declares, as `<config key>:<binding name>`.
 * Bindings sit at different depths per kind — `images: { binding }`,
 * `kv_namespaces: [{ binding }]`, `queues: { producers: [{ binding }] }` — so
 * this walks the whole tree for anything that names one.
 */
function bindingsIn(config: Record<string, unknown>): string[] {
	const found: string[] = [];
	const walk = (key: string, value: unknown): void => {
		if (Array.isArray(value)) value.forEach((item) => walk(key, item));
		else if (typeof value === 'object' && value !== null) {
			if ('binding' in value) found.push(`${key}:${String(value.binding)}`);
			for (const nested of Object.values(value)) walk(key, nested);
		}
	};
	for (const [key, value] of Object.entries(config)) walk(key, value);
	return found.sort();
}

describe('dynamic routes', () => {
	it('found the page sources', () => {
		expect(Object.keys(pages).length).toBeGreaterThan(0);
	});

	it('only the Client Inquiry endpoint sets prerender = false', () => {
		const dynamic = Object.keys(pages).filter((path) => OPTS_OUT.test(pages[path]));

		expect(dynamic).toEqual(['/src/pages/hire/inquiry.astro']);
	});

	// The adapter also serves /_image from the worker. It is framework
	// plumbing rather than a project route, it can't be turned off, and with
	// images compiled at build it only passes local assets through. What can be
	// turned off is: the worker gets D1 and its static assets, and nothing else.
	it('ships a worker bound to D1 and its assets only', () => {
		expect(builtWorker).toBeDefined();

		expect(bindingsIn(builtWorker ?? {})).toEqual(['assets:ASSETS', 'd1_databases:DB']);
	});
});
