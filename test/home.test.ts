import { SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import {
	escapeHtml,
	featuredProjects,
	publishedProjects,
	sectionLabelled,
	unfeaturedCurrent,
	urlFor,
} from './project-fixtures';

// Read outside the workerd sandbox, so the test can assert on what the page
// is *written* as and not only on what it renders — which is how "no Project
// title is hard-coded" is checkable at all.
const pageSource = Object.values(
	import.meta.glob('/src/pages/index.astro', { eager: true, query: '?raw', import: 'default' }),
)[0] as string | undefined;

if (typeof pageSource !== 'string') {
	// Guard the glob itself: a pattern that stops matching would otherwise
	// make the hard-coding assertions below pass against `undefined`.
	throw new Error('Could not read src/pages/index.astro');
}

let html: string;

beforeAll(async () => {
	html = await (await SELF.fetch('https://example.com/')).text();
});

function mainContent(page: string): string {
	const matched = /<main[^>]*>([\s\S]*?)<\/main>/.exec(page);
	if (!matched) throw new Error('No <main> in the page');
	return matched[1];
}

describe('/ home page', () => {
	it('returns 200 and renders exactly one <h1>', async () => {
		const response = await SELF.fetch('https://example.com/');

		expect(response.status).toBe(200);
		expect((html.match(/<h1[\s>]/gi) ?? []).length).toBe(1);
	});

	describe('the hero', () => {
		// The 2016 tagline, carried over near-verbatim: the site's one piece of
		// established personality (research §"Theme copy", index.twig:4-14).
		// Asserted on the distinctive fragment rather than the whole sentence,
		// so rewording the surrounding copy is not a test failure.
		it('carries the tagline from the 2016 site', () => {
			expect(html).toMatch(/no roads/i);
		});

		it('states who the practice serves', () => {
			expect(html).toMatch(/mission-driven/i);
		});
	});

	describe('featured Projects', () => {
		// Every assertion below iterates the content set, so a set with nothing
		// featured would pass silently. This is the guard against that.
		it('the content set has both featured and unfeatured Current Work', () => {
			expect(featuredProjects.length).toBeGreaterThan(0);
			expect(unfeaturedCurrent.length).toBeGreaterThan(0);
		});

		it.each(featuredProjects)('shows featured $slug, linking to its Project page', (project) => {
			const featured = sectionLabelled(html, 'featured-work-heading');

			expect(featured).toContain(`href="${urlFor(project)}"`);
			expect(featured).toContain(escapeHtml(project.title));
		});

		it('shows exactly the featured Projects, in the frontmatter order', () => {
			const featured = sectionLabelled(html, 'featured-work-heading');
			const linked = [...featured.matchAll(/href="\/work\/([^/"]+)\//g)].map((m) => m[1]);

			expect(linked).toEqual(featuredProjects.map((project) => project.slug));
		});

		// The flag is the whole selection mechanism: flipping `featured` in a
		// Markdown file has to be enough to change the shop window. A title
		// written into the page would survive that flip and go stale.
		it.each(publishedProjects)('does not hard-code the title of $slug', (project) => {
			expect(pageSource).not.toContain(project.title);
		});
	});

	it('leads to /hire/ from the page itself, not only the site navigation', () => {
		expect(mainContent(html)).toContain('href="/hire/"');
	});

	describe('the legacy query-string shim', () => {
		// The shim is client-side, so it cannot be exercised by a fetch — there
		// is no DOM here. Its routing is unit-tested in
		// legacy-query-routes.test.ts; what this proves is that the module
		// carrying it actually ships with the page, mapped to the live routes.
		it('ships a script that knows the 2016 routes', async () => {
			// Astro inlines a small module script and emits a larger one as a
			// file. Which side of that threshold the shim falls on is a build
			// detail, so resolve either into the same string rather than
			// pinning the suite to one of them.
			const tags = [...html.matchAll(/<script type="module"(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g)];
			expect(tags.length, 'the home page loads no module script').toBeGreaterThan(0);

			const sources = await Promise.all(
				tags.map(async ([, src, inline]) =>
					src ? (await SELF.fetch(new URL(src, 'https://example.com/'))).text() : inline,
				),
			);
			const shipped = sources.join('\n');

			expect(shipped).toContain('/about/');
			expect(shipped).toContain('/hire/');
		});
	});
});
