import { beforeAll, describe, expect, it } from 'vitest';
import { draftsIn, get, listedSlugs, listingFixturePosts, type Post, publishedIn, urlFor } from '../blog-fixtures';
import { BLOG_LINK, escapeHtml, navMarkup } from '../content-fixtures';

// Runs against the build of test/fixtures/blog-listing (see vitest.config.ts),
// which holds published Posts and a draft: the branch /blog/ switches to the
// moment a Post is published, with no code change.
const published = publishedIn(listingFixturePosts);
const drafts = draftsIn(listingFixturePosts);

/** The fixture body's own sentinel, proving the Markdown was rendered. */
function markerOf(post: Post): string {
	const matched = /Marker: ([A-Z-]+)/.exec(post.body);
	if (!matched) throw new Error(`Fixture Post ${post.slug} has no body marker`);
	return matched[1];
}

let blogIndex: { status: number; html: string };

beforeAll(async () => {
	blogIndex = await get('/blog/');
});

describe('/blog/ with Posts present', () => {
	it('the fixture set exercises ordering and drafts', () => {
		expect(published.length).toBeGreaterThan(1);
		expect(drafts.length).toBeGreaterThan(0);

		// Ordering is only proved if the Posts disagree about their dates, and
		// only interesting if that order differs from the file names.
		expect(new Set(published.map((post) => post.pubDate)).size).toBe(published.length);
		expect(published.map((post) => post.slug)).not.toEqual(published.map((post) => post.slug).sort());
	});

	it('returns 200', () => {
		expect(blogIndex.status).toBe(200);
	});

	it('drops the empty state', () => {
		expect(blogIndex.html).not.toContain('no-posts-heading');
	});

	it('lists every published Post, newest first', () => {
		expect(listedSlugs(blogIndex.html)).toEqual(published.map((post) => post.slug));
	});

	it.each(published)('lists $slug with its title, description, and date', (post) => {
		expect(blogIndex.html).toContain(escapeHtml(post.title));
		expect(blogIndex.html).toContain(escapeHtml(post.description));
		expect(blogIndex.html).toContain(`datetime="${post.pubDate}T00:00:00.000Z"`);
	});

	it.each(published)('serves $slug at its own URL, rendering its Markdown', async (post) => {
		const { status, html } = await get(urlFor(post));

		expect(status).toBe(200);
		expect(html).toContain(`<h1>${escapeHtml(post.title)}</h1>`);
		expect(html).toContain(markerOf(post));
	});

	it.each(drafts)('gives draft $slug no page and no listing row', async (post) => {
		expect(blogIndex.html).not.toContain(urlFor(post));
		expect(blogIndex.html).not.toContain(escapeHtml(post.title));
		expect((await get(urlFor(post))).status).toBe(404);
	});

	// The nav link arrives with the first published Post, as a content act
	// (spec #1, user story 38), on every kind of page, not only the blog's.
	it.each(['/', '/work/', '/blog/'])('links to the blog from the navigation on %s', async (path) => {
		expect(navMarkup((await get(path)).html)).toMatch(BLOG_LINK);
	});

	it.each(published)('links to the blog from the navigation on $slug', async (post) => {
		expect(navMarkup((await get(urlFor(post))).html)).toMatch(BLOG_LINK);
	});
});
