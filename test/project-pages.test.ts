import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('Project pages', () => {
	it('a draft Project has no page at its would-be URL', async () => {
		const response = await SELF.fetch('https://example.com/work/draft-in-progress/');
		expect(response.status).toBe(404);
	});

	it('an Earlier Work Project has no /work/<slug>/ page', async () => {
		const response = await SELF.fetch('https://example.com/work/riverside-arts-guild/');
		expect(response.status).toBe(404);
	});

	it('renders honestly with no Client name and no placeholder', async () => {
		const response = await SELF.fetch('https://example.com/work/mutual-aid-network/');
		const html = await response.text();
		expect(response.status).toBe(200);
		expect(html).not.toMatch(/case study/i);
	});
});
