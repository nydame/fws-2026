// The Post content sets, read from the source Markdown at transform time.
//
// /blog/ has two branches and one static build can only be in one of them,
// so `pnpm test` builds the site once per fixture set (see vitest.config.ts):
//
//   - `sitePosts` is the real content in src/content/blog. The shipping build
//     is tested against whatever that holds, so publishing the first Post
//     needs no test change.
//   - `emptyFixturePosts` (test/fixtures/blog-empty) holds only a draft, so
//     its build is always in the empty-state branch.
//   - `listingFixturePosts` (test/fixtures/blog-listing) holds published
//     Posts and a draft, so its build is always in the listing branch.
//
// `import.meta.glob` is resolved by Vite outside the workerd sandbox the test
// bodies run in (see all-routes.test.ts), which is what makes the source
// Markdown reachable from a test that otherwise only has `SELF.fetch()`.
// Vite needs each glob's arguments as literals, hence the repetition below.
import { SELF } from 'cloudflare:test';
import { bodyOf, parseFrontmatter, requireString, slugFromPath } from './content-fixtures';

export interface Post {
	/** Matches Astro's collection `id`, and so the `/blog/<slug>/` URL. */
	slug: string;
	title: string;
	description: string;
	/** The frontmatter date, as written: `YYYY-MM-DD`. */
	pubDate: string;
	draft: boolean;
	/** The Markdown after the frontmatter, so a test can prove it was rendered. */
	body: string;
}

function toPost(path: string, raw: string): Post {
	const fields = parseFrontmatter(raw, path);

	return {
		slug: slugFromPath(path),
		title: requireString(fields, 'title', path),
		description: requireString(fields, 'description', path),
		pubDate: requireString(fields, 'pubDate', path),
		// `draft` defaults to false in the Zod schema, so an absent key is a
		// legitimate `false` rather than a malformed file.
		draft: fields.draft === 'true',
		body: bodyOf(raw, path),
	};
}

function readPosts(sources: Record<string, unknown>): Post[] {
	return Object.entries(sources as Record<string, string>).map(([path, raw]) => toPost(path, raw));
}

export const sitePosts = readPosts(
	import.meta.glob('/src/content/blog/*.md', { eager: true, query: '?raw', import: 'default' }),
);
export const emptyFixturePosts = readPosts(
	import.meta.glob('/test/fixtures/blog-empty/*.md', { eager: true, query: '?raw', import: 'default' }),
);
export const listingFixturePosts = readPosts(
	import.meta.glob('/test/fixtures/blog-listing/*.md', { eager: true, query: '?raw', import: 'default' }),
);

/**
 * The Posts that get a page and a listing row, newest first.
 *
 * This deliberately restates src/lib/blog-posts.ts's `publishedPosts` rather
 * than importing it: the tests are checking that rule, so they can't borrow it.
 */
export function publishedIn(posts: Post[]): Post[] {
	return posts.filter((post) => !post.draft).sort((a, b) => b.pubDate.localeCompare(a.pubDate));
}

/** Must not appear anywhere in the build. */
export function draftsIn(posts: Post[]): Post[] {
	return posts.filter((post) => post.draft);
}

export function urlFor(post: Post): string {
	return `/blog/${post.slug}/`;
}

/** The Posts a /blog/ page lists, as slugs in page order. */
export function listedSlugs(html: string): string[] {
	return [...html.matchAll(/href="\/blog\/([^/"]+)\//g)].map((match) => match[1]);
}

export async function get(path: string) {
	const response = await SELF.fetch(new URL(path, 'https://example.com/'));
	return { status: response.status, html: await response.text() };
}
