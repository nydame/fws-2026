import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { draftProjects, earlierProjects, escapeHtml, publishedCurrent, urlFor } from './project-fixtures';

// Wording the site has retired or must never ship, checked on every Project
// page rather than on one hand-picked example. "case study" is the 2016 site's
// term for these, retired in CONTEXT.md.
const FORBIDDEN = [/case study/i, /\bTBD\b/i, /\blorem ipsum\b/i, /\bplaceholder\b/i, /\bcoming soon\b/i];

async function get(path: string) {
	const response = await SELF.fetch(new URL(path, 'https://example.com/'));
	return { status: response.status, html: await response.text() };
}

describe('Project pages', () => {
	it('the content set exercises published, draft, and Earlier Work Projects', () => {
		expect(publishedCurrent.length).toBeGreaterThan(0);
		expect(draftProjects.length).toBeGreaterThan(0);
		expect(earlierProjects.length).toBeGreaterThan(0);
	});

	it.each(draftProjects)('a draft Project ($slug) has no page at its would-be URL', async (project) => {
		expect((await get(urlFor(project))).status).toBe(404);
	});

	it.each(earlierProjects)('an Earlier Work Project ($slug) has no /work/<slug>/ page', async (project) => {
		expect((await get(urlFor(project))).status).toBe(404);
	});

	it.each(publishedCurrent)('$slug is served at its own URL', async (project) => {
		expect((await get(urlFor(project))).status).toBe(200);
	});

	it.each(publishedCurrent)('$slug names its Client only when it has one', async (project) => {
		const { html } = await get(urlFor(project));

		if (project.client) {
			expect(html).toContain('<dt>Client</dt>');
			expect(html).toContain(escapeHtml(project.client));
		} else {
			// An unnamed Client is rendered honestly: the row is absent, not
			// filled with a stand-in (CONTEXT.md).
			expect(html).not.toContain('<dt>Client</dt>');
		}
	});

	it.each(publishedCurrent)('$slug ships no placeholder or retired wording', async (project) => {
		const { html } = await get(urlFor(project));

		for (const pattern of FORBIDDEN) {
			expect(html).not.toMatch(pattern);
		}
	});
});
