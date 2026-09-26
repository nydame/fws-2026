// Reading the sitemap and the robots policy back out of a build, for the
// tests that assert what crawlers are told (issue #13).
//
// Shared because the shipping build and the fixture-Post build in
// test/fixtures/blog-listing both have a sitemap worth asserting on, and
// they have to be read the same way to mean the same thing.
import { request } from './content-fixtures';

/** The origin astro.config.mjs stamps into every absolute URL it generates. */
export const SITE = 'https://go-firefly.com';

/**
 * The routes the site deliberately keeps out of the sitemap and blocks in
 * the robots policy: the two halves of the Client Inquiry pipeline that
 * nobody should arrive at from a search result.
 *
 * Restated here rather than imported from src/lib/crawling.ts. The tests
 * are checking that rule, so they can't borrow it — the same reason
 * blog-fixtures.ts restates `publishedPosts`.
 */
export const UNADVERTISED_PATHS = ['/hire/inquiry/', '/hire/received/'];

async function textAt(path: string): Promise<string> {
	const response = await request(path);
	if (!response.ok) throw new Error(`${path} responded ${response.status}`);
	return response.text();
}

function locsIn(xml: string): string[] {
	return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

/**
 * Every URL the site advertises, followed from the sitemap index through
 * each sitemap it names — the same walk a crawler does.
 */
export async function sitemapUrls(): Promise<string[]> {
	const urls: string[] = [];
	for (const loc of locsIn(await textAt('/sitemap-index.xml'))) {
		urls.push(...locsIn(await textAt(new URL(loc).pathname)));
	}
	return urls.sort();
}

/**
 * Every advertised URL for one entry, whichever section it sits under.
 *
 * A draft is proved absent this way rather than by its expected URL, so the
 * assertion doesn't depend on guessing which section would have held it.
 */
export function advertisedFor(urls: string[], slug: string): string[] {
	return urls.filter((url) => new URL(url).pathname.endsWith(`/${slug}/`));
}

/**
 * The paths the robots policy's `User-agent: *` group disallows.
 *
 * Group tracking is the whole point: a `Disallow` written for one named
 * crawler says nothing about what everyone else may index, and reading it
 * as though it did would let this test pass on a policy that blocks the
 * site. Nothing beyond that is parsed.
 */
export function disallowedPrefixes(robots: string): string[] {
	const prefixes: string[] = [];
	let inWildcardGroup = false;

	for (const line of robots.split(/\r?\n/)) {
		const [rawField, ...rest] = line.split(':');
		const field = rawField.trim().toLowerCase();
		const value = rest.join(':').trim();

		if (field === 'user-agent') inWildcardGroup = value === '*';
		// An empty `Disallow:` is the explicit "nothing is blocked" rule.
		else if (field === 'disallow' && inWildcardGroup && value !== '') prefixes.push(value);
	}

	return prefixes;
}
