import { beforeAll, describe, expect, it } from 'vitest';
import { draftsIn, emptyFixturePosts, get, listedSlugs, publishedIn, urlFor } from '../blog-fixtures';
import { escapeHtml, sectionLabelled } from '../content-fixtures';

// Runs against the build of test/fixtures/blog-empty (see vitest.config.ts),
// which holds nothing but a draft: the branch /blog/ is in until the first
// Post is published, pinned here so it stays covered afterwards too.
const drafts = draftsIn(emptyFixturePosts);

let blogIndex: { status: number; html: string };

beforeAll(async () => {
	blogIndex = await get('/blog/');
});

describe('/blog/ with no published Post', () => {
	it('the fixture set is drafts only', () => {
		expect(publishedIn(emptyFixturePosts)).toEqual([]);
		expect(drafts.length).toBeGreaterThan(0);
	});

	it('returns 200 rather than reading as a broken URL', () => {
		expect(blogIndex.status).toBe(200);
	});

	it('renders the empty state', () => {
		const emptyState = sectionLabelled(blogIndex.html, 'no-posts-heading');

		expect(emptyState).toMatch(/<h2[^>]*id="no-posts-heading"[^>]*>[^<]+<\/h2>/);
		expect(emptyState).toMatch(/<p>[^<]+/);
	});

	it('lists no Posts', () => {
		expect(listedSlugs(blogIndex.html)).toEqual([]);
	});

	it.each(drafts)('gives draft $slug no page and no listing row', async (post) => {
		expect(blogIndex.html).not.toContain(escapeHtml(post.title));
		expect((await get(urlFor(post))).status).toBe(404);
	});
});
