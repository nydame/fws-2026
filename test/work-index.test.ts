import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('/work/ index', () => {
	it('returns 200', async () => {
		const response = await SELF.fetch('https://example.com/work/');
		expect(response.status).toBe(200);
	});

	it('lists Current Work projects, each linking to its Project page', async () => {
		const response = await SELF.fetch('https://example.com/work/');
		const html = await response.text();

		expect(html).toContain('href="/work/lighthouse-collective/"');
		expect(html).toContain('href="/work/mutual-aid-network/"');
	});

	it('excludes drafts from Current Work', async () => {
		const response = await SELF.fetch('https://example.com/work/');
		const html = await response.text();

		expect(html).not.toContain('/work/draft-in-progress/');
		expect(html).not.toContain('Placeholder: in-progress engagement');
	});

	it('renders Earlier Work as a dated row with no link to a Project page', async () => {
		const response = await SELF.fetch('https://example.com/work/');
		const html = await response.text();

		expect(html).toContain('Riverside Arts Guild');
		expect(html).not.toContain('href="/work/riverside-arts-guild/"');
	});

	it('states the offer in a Services section, with no standalone /services/ route', async () => {
		const indexResponse = await SELF.fetch('https://example.com/work/');
		const html = await indexResponse.text();
		expect(html).toMatch(/<h2[^>]*>Services<\/h2>/);

		const servicesResponse = await SELF.fetch('https://example.com/services/');
		expect(servicesResponse.status).toBe(404);
	});
});
