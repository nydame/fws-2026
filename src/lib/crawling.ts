// What this site tells crawlers, in one place.
//
// The sitemap filter in astro.config.mjs and the robots policy at
// /robots.txt have to agree about what is advertised and what is off
// limits. They agree by construction rather than by both being edited.

/**
 * Path prefixes no crawler should follow.
 *
 * Both belong to the Client Inquiry pipeline
 * (docs/adr/0001-client-inquiry-pipeline.md), and neither is a place to
 * arrive from a search result:
 *
 *   - `/hire/inquiry/` answers a POST. It is the site's only
 *     non-prerendered route, and a crawler getting it would only ever be
 *     told its Client Inquiry was invalid. @astrojs/sitemap would list it
 *     regardless: the integration collects page routes from the route
 *     table, where prerendering makes no difference.
 *   - `/hire/received/` confirms a Client Inquiry that was just sent. It is
 *     reached by redirect and linked from nowhere, so the only way into it
 *     from a search result is to be told a message was received that was
 *     never sent.
 *
 * Everything else the build emits is advertised. That is what lets a new
 * Project or Post reach the sitemap with no code change — and what keeps a
 * draft out, since a draft is never built into a route at all.
 */
export const DISALLOWED_PATHS = ['/hire/inquiry/', '/hire/received/'];

/** The sitemap index @astrojs/sitemap writes, relative to the site root. */
export const SITEMAP_INDEX_PATH = '/sitemap-index.xml';

/** Whether a built page belongs in the sitemap; @astrojs/sitemap's `filter`. */
export function isCrawlable(url: string): boolean {
	const { pathname } = new URL(url);
	return !DISALLOWED_PATHS.some((prefix) => pathname.startsWith(prefix));
}

export function robotsPolicy(site: URL): string {
	return [
		'User-agent: *',
		'Allow: /',
		...DISALLOWED_PATHS.map((path) => `Disallow: ${path}`),
		'',
		`Sitemap: ${new URL(SITEMAP_INDEX_PATH, site).href}`,
		'',
	].join('\n');
}
