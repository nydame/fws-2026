import { SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import {
	draftProjects,
	escapeHtml,
	publishedCurrent,
	publishedEarlier,
	publishedProjects,
	sectionLabelled,
	urlFor,
} from './project-fixtures';

let html: string;

beforeAll(async () => {
	html = await (await SELF.fetch('https://example.com/work/')).text();
});

describe('/work/ index', () => {
	// Every assertion below iterates the content set, so an empty set would
	// pass silently. This is the guard against that.
	it('the content set exercises Current Work, Earlier Work, and drafts', () => {
		expect(publishedCurrent.length).toBeGreaterThan(0);
		expect(publishedEarlier.length).toBeGreaterThan(0);
		expect(draftProjects.length).toBeGreaterThan(0);
	});

	it('returns 200', async () => {
		const response = await SELF.fetch('https://example.com/work/');
		expect(response.status).toBe(200);
	});

	it.each(publishedCurrent)('lists Current Work $slug, linking to its Project page', (project) => {
		const currentWork = sectionLabelled(html, 'current-work-heading');
		expect(currentWork).toContain(`href="${urlFor(project)}"`);
		expect(currentWork).toContain(escapeHtml(project.title));
	});

	it('orders Current Work by the frontmatter order key', () => {
		const currentWork = sectionLabelled(html, 'current-work-heading');
		const linked = [...currentWork.matchAll(/href="\/work\/([^/"]+)\//g)].map((m) => m[1]);

		expect(linked).toEqual(publishedCurrent.map((project) => project.slug));
	});

	it.each(draftProjects)('omits draft $slug entirely', (project) => {
		expect(html).not.toContain(urlFor(project));

		// A draft sharing its title with a published Project (an earlier cut of
		// the same piece) is invisible to a title check — the published twin
		// legitimately renders it. The URL assertion above still covers it.
		const titleIsItsOwn = !publishedProjects.some((other) => other.title === project.title);
		if (titleIsItsOwn) expect(html).not.toContain(escapeHtml(project.title));
	});

	it.each(publishedEarlier)('renders Earlier Work $slug as a dated row with no link', (project) => {
		const earlierWork = sectionLabelled(html, 'earlier-work-heading');
		expect(earlierWork).toContain(escapeHtml(project.title));
		expect(earlierWork).toContain(project.startDate.slice(0, 4));
		expect(earlierWork).not.toContain(`href="${urlFor(project)}"`);
	});

	it('states the offer in a Services section, with no standalone /services/ route', async () => {
		expect(html).toMatch(/<h2[^>]*>Services<\/h2>/);

		const servicesResponse = await SELF.fetch('https://example.com/services/');
		expect(servicesResponse.status).toBe(404);
	});
});
