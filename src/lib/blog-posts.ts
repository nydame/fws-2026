import type { CollectionEntry } from 'astro:content';

/**
 * The Posts the site publishes, newest first.
 *
 * Both rules live here rather than in the pages, so /blog/ and
 * /blog/<slug>/ can't drift apart: a draft Post gets no page and appears in
 * no listing, and the listing order is the publish date — never the file
 * name or build order (issue #8).
 *
 * An empty result is the blog's other, deliberate state: /blog/ renders its
 * empty state rather than an empty list.
 */
export function publishedPosts(posts: CollectionEntry<'blog'>[]): CollectionEntry<'blog'>[] {
	return posts
		.filter((post) => !post.data.draft)
		.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}
