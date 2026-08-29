import type { CollectionEntry } from 'astro:content';

// Listings sort by the frontmatter `order` key, never by file name or build
// order (see content.config.ts and issue #5's acceptance criteria).
export function compareByOrder(a: CollectionEntry<'projects'>, b: CollectionEntry<'projects'>): number {
	return a.data.order - b.data.order;
}
