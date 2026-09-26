import { describe, expect, it } from 'vitest';
import { draftsIn, sitePosts } from './blog-fixtures';
import { builtRoutes } from './built-routes';
import { request } from './content-fixtures';
import { draftProjects } from './project-fixtures';
import {
	advertisedFor,
	disallowedPrefixes,
	SITE,
	sitemapUrls,
	UNADVERTISED_PATHS,
} from './sitemap-fixtures';

// Every draft in the content set, Project and Post alike. None is built into
// a route, so none can reach the sitemap — this is what proves it.
const draftSlugs = [...draftProjects, ...draftsIn(sitePosts)].map((entry) => entry.slug);

async function robotsPolicy(): Promise<string> {
	return (await request('/robots.txt')).text();
}

describe('sitemap', () => {
	it('found routes and drafts in the content set to check against', () => {
		expect(builtRoutes).toContain('/');
		expect(draftSlugs.length).toBeGreaterThan(0);
	});

	// Nothing enumerates the content on either side: the sitemap comes from
	// what the build emitted and so does `builtRoutes`, with only the fixed
	// two taken back out. A Project or Post added as Markdown is therefore
	// in the sitemap with no code change, and this test needs none either.
	it('lists every published route the build produced, and nothing else', async () => {
		const expected = builtRoutes
			.filter((route) => !UNADVERTISED_PATHS.includes(route))
			.map((route) => `${SITE}${route}`)
			.sort();

		expect(expected.length).toBeGreaterThan(UNADVERTISED_PATHS.length);
		expect(await sitemapUrls()).toEqual(expected);
	});

	it.each(UNADVERTISED_PATHS)('does not advertise %s', async (path) => {
		expect(await sitemapUrls()).not.toContain(`${SITE}${path}`);
	});

	it.each(draftSlugs)('does not advertise the draft %s', async (slug) => {
		expect(advertisedFor(await sitemapUrls(), slug)).toEqual([]);
	});
});

describe('robots policy', () => {
	it('is served as plain text', async () => {
		const response = await request('/robots.txt');

		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toMatch(/^text\/plain\b/);
	});

	// The policy and the sitemap have to agree, or the site advertises a
	// page and then tells the crawler that found it to keep out.
	it('permits indexing of every route it advertises', async () => {
		const blocked = disallowedPrefixes(await robotsPolicy());
		const advertised = (await sitemapUrls()).map((url) => new URL(url).pathname);

		expect(blocked).not.toContain('/');
		expect(advertised.filter((path) => blocked.some((prefix) => path.startsWith(prefix)))).toEqual(
			[],
		);
	});

	it('keeps crawlers off the Client Inquiry pipeline, and off nothing else', async () => {
		expect(disallowedPrefixes(await robotsPolicy())).toEqual(UNADVERTISED_PATHS);
	});

	it('points at a sitemap that is actually served', async () => {
		const sitemaps = [...(await robotsPolicy()).matchAll(/^Sitemap:\s*(\S+)$/gim)].map(
			(match) => match[1],
		);

		expect(sitemaps).toEqual([`${SITE}/sitemap-index.xml`]);
		expect((await request(new URL(sitemaps[0]).pathname)).status).toBe(200);
	});
});
