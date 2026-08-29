import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// A Project: one piece of work shown to demonstrate capability (CONTEXT.md).
// `era` separates Current Work (2018 onward, gets its own /work/<slug>/ page)
// from Earlier Work (pre-2018, listed as dated rows only — see issue #5).
const projects = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
	schema: z.object({
		title: z.string(),
		// Absent means the Client is unnamed — render honestly, not a placeholder.
		client: z.string().optional(),
		summary: z.string(),
		startDate: z.coerce.date(),
		// Absent means a single date rather than a range.
		endDate: z.coerce.date().optional(),
		era: z.enum(['current', 'earlier']),
		technologies: z.array(z.string()),
		liveUrl: z.string().url().optional(),
		screenshot: z.string().optional(),
		featured: z.boolean().default(false),
		// Explicit ordering key — listings sort by this, not file name or build order.
		order: z.number(),
		draft: z.boolean().default(false),
	}),
});

export const collections = { projects };
