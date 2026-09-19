import { beforeAll, describe, expect, it } from 'vitest';
import { draftsIn, get, listedSlugs, publishedIn, sitePosts, urlFor } from './blog-fixtures';
import { BLOG_LINK, escapeHtml, navMarkup } from './content-fixtures';

// The blog as it ships. These assertions follow whatever src/content/blog
// holds, so the first Post goes live with no test change; each branch of
// /blog/ is pinned by its own fixture build in test/blog-fixture-builds/.
const published = publishedIn(sitePosts);
const drafts = draftsIn(sitePosts);

// Every page the build produced, so the blog's navigation link is checked
// site-wide rather than on one hand-picked page. Resolved by Vite outside the
// workerd sandbox, like all-routes.test.ts.
const builtPages = import.meta.glob('/dist/client/**/*.html', {
	eager: true,
	query: '?raw',
	import: 'default',
}) as Record<string, string>;

let blogIndex: { status: number; html: string };

beforeAll(async () => {
	blogIndex = await get('/blog/');
});

describe('/blog/ as shipped', () => {
	it('returns 200', () => {
		expect(blogIndex.status).toBe(200);
	});

	it('lists exactly the published Posts, newest first', () => {
		expect(listedSlugs(blogIndex.html)).toEqual(published.map((post) => post.slug));
	});

	it('renders the empty state if and only if nothing is published', () => {
		expect(blogIndex.html.includes('id="no-posts-heading"')).toBe(published.length === 0);
	});

	it.each(published)('serves published $slug at its own URL', async (post) => {
		expect((await get(urlFor(post))).status).toBe(200);
	});

	it.each(drafts)('gives draft $slug no page and no listing row', async (post) => {
		expect(blogIndex.html).not.toContain(urlFor(post));
		expect(blogIndex.html).not.toContain(escapeHtml(post.title));
		expect((await get(urlFor(post))).status).toBe(404);
	});

	it('found the built pages to sweep for navigation links', () => {
		expect(Object.keys(builtPages).length).toBeGreaterThan(0);
	});

	// The blog stays out of the navigation until it has a published Post,
	// then appears on every page (spec #1, user story 38).
	it.each(Object.keys(builtPages))('%s links to the blog from its navigation if and only if a Post is published', (page) => {
		expect(BLOG_LINK.test(navMarkup(builtPages[page]))).toBe(published.length > 0);
	});
});
