import { SELF } from 'cloudflare:test';

// Every route the build produced, fetched once through the one seam
// (vitest.config.ts) and kept for a suite to read. A sweep over every page
// asks for all of them up front; each one is a request, so it is made once.

/** The origin the tests request the site at; nothing depends on the name. */
export const ORIGIN = 'https://example.com';

/** A page as a browser received it. */
export interface BuiltPage {
	status: number;
	html: string;
	headers: Headers;
}

/** One page, from any request a test cares to make — a GET, or a form post. */
export async function fetchPage(request: Request | URL): Promise<BuiltPage> {
	const response = await SELF.fetch(request);
	return { status: response.status, html: await response.text(), headers: response.headers };
}

/**
 * Fetches `routes` and hands back a lookup that throws on a route it was
 * never asked to fetch, so a typo in a test reads as a mistake rather than
 * as a page with nothing on it.
 */
export async function fetchPages(routes: string[]): Promise<(route: string) => BuiltPage> {
	const pages = new Map<string, BuiltPage>();

	for (const route of routes) {
		pages.set(route, await fetchPage(new URL(route, ORIGIN)));
	}

	return (route) => {
		const page = pages.get(route);
		if (!page) throw new Error(`${route} was not fetched`);
		return page;
	};
}
