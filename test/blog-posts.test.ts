import { describe, expect, it } from 'vitest';
import { publishedPosts } from '../src/lib/blog-posts';

type Entry = Parameters<typeof publishedPosts>[0][number];

function post(id: string, pubDate: string, draft = false): Entry {
	return { id, data: { pubDate: new Date(pubDate), draft } } as Entry;
}

describe('publishedPosts', () => {
	it('selects nothing while there are no Posts — the branch /blog/ ships in', () => {
		expect(publishedPosts([])).toEqual([]);
	});

	it('orders Posts newest first, regardless of input order', () => {
		const posts = [post('middle', '2026-01-12'), post('oldest', '2025-11-02'), post('newest', '2026-03-04')];

		expect(publishedPosts(posts).map((entry) => entry.id)).toEqual(['newest', 'middle', 'oldest']);
	});

	it('drops drafts, including one newer than every published Post', () => {
		const posts = [post('published', '2026-01-12'), post('unpublished', '2026-04-01', true)];

		expect(publishedPosts(posts).map((entry) => entry.id)).toEqual(['published']);
	});

	it('selects nothing when every Post is a draft', () => {
		expect(publishedPosts([post('unpublished', '2026-04-01', true)])).toEqual([]);
	});

	it('leaves the collection it was given alone', () => {
		const posts = [post('middle', '2026-01-12'), post('newest', '2026-03-04')];

		publishedPosts(posts);

		expect(posts.map((entry) => entry.id)).toEqual(['middle', 'newest']);
	});
});
