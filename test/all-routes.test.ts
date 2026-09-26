import { SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';
import { builtRoutes as routes } from './built-routes';

function countH1s(html: string): number {
	return (html.match(/<h1[\s>]/gi) ?? []).length;
}

describe('all-routes sweep', () => {
	it('found at least the home route in the build output', () => {
		expect(routes).toContain('/');
	});

	it.each(routes)('%s responds 200 and renders exactly one <h1>', async (route) => {
		const response = await SELF.fetch(new URL(route, 'https://example.com/'));
		expect(response.status).toBe(200);
		expect(countH1s(await response.text())).toBe(1);
	});

	it('an unknown route is served as a 404 with exactly one <h1>', async () => {
		const response = await SELF.fetch('https://example.com/this-route-does-not-exist/');
		expect(response.status).toBe(404);
		expect(countH1s(await response.text())).toBe(1);
	});
});
