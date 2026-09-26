import type { APIRoute } from 'astro';
import { robotsPolicy } from '../lib/crawling';

// Generated rather than dropped in public/, so the sitemap URL it names
// comes from the same `site` the sitemap is built with instead of being a
// second copy of the origin that can go stale (issue #13).
export const GET: APIRoute = ({ site }) => {
	if (!site) throw new Error('astro.config.mjs must set `site` for /robots.txt to name the sitemap');

	return new Response(robotsPolicy(site), {
		headers: { 'content-type': 'text/plain; charset=utf-8' },
	});
};
