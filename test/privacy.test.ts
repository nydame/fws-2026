import { beforeAll, describe, expect, it } from 'vitest';
import { type BuiltPage, fetchPage, fetchPages, ORIGIN } from './built-pages';
import { MISSING_ROUTE, renderedRoutes } from './built-routes';
import { codeSurfaceOf, consentMachineryIn, emailAddressesIn, mailtoLinksIn, retiredThirdPartiesIn, subresourceUrlsIn } from './privacy';

// The close-out of the migration's privacy promises (issue #14, spec #1): the
// 2016 site's third-party baggage is gone, no address is published for a
// scraper to find, and nothing the site does needs a visitor's consent.
//
// It sweeps every page the site renders rather than naming any of them, so a
// page added by a later ticket is covered the day it ships — and a regression
// on it fails the build instead of waiting to be noticed.

/**
 * The one page not reachable by a GET: what the Client Inquiry endpoint —
 * the site's only route that isn't prerendered — renders when it rejects a
 * submission. It is swept like the rest, because it is a page a Prospective
 * Client sees, and because it is the only page whose markup contains anything
 * a stranger typed.
 *
 * The email it posts is deliberately not an address: that is what makes the
 * inquiry invalid, and it keeps the echoed value — which is the Prospective
 * Client's own, and published to nobody — out of the address sweep. The 403
 * and 500 renders are this same page with a different message.
 */
const REJECTED_INQUIRY = 'POST /hire/inquiry/ (rejected)';

function rejectedInquiryRequest(): Request {
	return new Request(new URL('/hire/inquiry/', ORIGIN), {
		method: 'POST',
		// The Origin header a browser always sends on a form post, which Astro's
		// cross-site request check requires.
		headers: { origin: ORIGIN, 'content-type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({ name: 'Ada Okafor', email: 'not-an-address', organization: 'Tenants & Neighbors', message: 'Our site runs on PHP from 2014.' }),
	});
}

const SWEPT = [...renderedRoutes, REJECTED_INQUIRY];

let pageAt: (page: string) => BuiltPage;
let codeSurfaceAt: (page: string) => string;

beforeAll(async () => {
	const routes = await fetchPages(renderedRoutes);
	const rejected = await fetchPage(rejectedInquiryRequest());
	pageAt = (page) => (page === REJECTED_INQUIRY ? rejected : routes(page));

	const surfaces = new Map(await Promise.all(SWEPT.map(async (page) => [page, await codeSurfaceFor(pageAt(page))] as const)));
	codeSurfaceAt = (page) => {
		const surface = surfaces.get(page);
		if (surface === undefined) throw new Error(`${page} was not read`);
		return surface;
	};
});

/**
 * Everything a page loads or runs, its own script bundles included:
 * `document.cookie` inside a bundled module is as much the site's doing as one
 * written into the markup. The build emits no bundles today, so this reaches
 * nothing extra — and keeps reaching whatever it emits tomorrow.
 */
async function codeSurfaceFor(page: BuiltPage): Promise<string> {
	const own = subresourceUrlsIn(page.html, ORIGIN).filter((url) => url.origin === ORIGIN && url.pathname.endsWith('.js'));
	const bundles = await Promise.all(own.map(async (url) => (await fetchPage(url)).html));

	return [codeSurfaceOf(page.html, ORIGIN), ...bundles].join('\n');
}

/** Third parties a page is allowed to load, and what each one is for. */
const ALLOWED_ORIGINS = new Map([
	// The Turnstile widget, which is how a Client Inquiry is verified as
	// human before anything is stored (docs/adr/0001-client-inquiry-pipeline.md).
	['https://challenges.cloudflare.com', 'Turnstile'],
	// Cloudflare Web Analytics (docs/adr/0002-cloudflare-web-analytics.md).
	['https://static.cloudflareinsights.com', 'Web Analytics'],
]);

describe('the privacy sweep', () => {
	it('covers every page the site renders: its routes, the 404, and a rejected Client Inquiry', () => {
		expect(SWEPT).toContain('/');
		expect(SWEPT).toContain('/hire/');
		expect(SWEPT).toContain(MISSING_ROUTE);
		expect(pageAt(MISSING_ROUTE).status).toBe(404);
		// A redirect here would mean the endpoint never rendered anything, and
		// the page this sweep thinks it is reading would be empty.
		expect(pageAt(REJECTED_INQUIRY).status).toBe(422);
	});

	// The brand sweeps read a page's code surface rather than its markup, so a
	// surface read as empty would pass every one of them for the wrong reason.
	it('reads what the home page loads and runs, not an empty surface', () => {
		expect(codeSurfaceAt('/')).toMatch(/static\.cloudflareinsights\.com\/beacon\.min\.js/);
	});

	it.each(SWEPT)('%s publishes no mailto: link', (page) => {
		expect(mailtoLinksIn(pageAt(page).html)).toEqual([]);
	});

	// The form is the front door, and an address in the markup is an address in
	// a scraper's list (spec #1, story 41).
	it.each(SWEPT)('%s publishes no plain-text email address', (page) => {
		expect(emailAddressesIn(pageAt(page).html)).toEqual([]);
	});

	it.each(SWEPT)('%s loads no Heap, Hotjar, Typeform, or Modernizr', (page) => {
		expect(retiredThirdPartiesIn(codeSurfaceAt(page))).toEqual([]);
	});

	it.each(SWEPT)('%s loads nothing from a third party but Turnstile and Web Analytics', (page) => {
		const urls = subresourceUrlsIn(pageAt(page).html, ORIGIN);

		// Every page loads something — the mark, the typeface, the beacon — so a
		// page this sweep reads as loading nothing has not been read at all.
		expect(urls.length, `${page} appears to load nothing`).toBeGreaterThan(0);

		for (const url of urls) {
			const allowed = url.origin === ORIGIN || ALLOWED_ORIGINS.has(url.origin);
			expect(allowed, `${page} loads ${url.href}`).toBe(true);
		}
	});

	// Nothing to consent to, so there is no banner and nothing asking: the site
	// sets no cookie from the server, and nothing it runs sets one either.
	// Astro's session store — the one thing in the build that would have set a
	// cookie — is off in astro.config.mjs.
	it.each(SWEPT)('%s sets no cookie and installs no consent machinery', (page) => {
		expect(pageAt(page).headers.get('set-cookie')).toBeNull();
		expect(consentMachineryIn(codeSurfaceAt(page))).toEqual([]);
	});
});

// A sweep for absence proves nothing if its detectors are blind, so each one
// is shown finding what it looks for on a page written to break every rule.
describe('the detectors the sweep is made of', () => {
	const OFFENDING_PAGE = `<!doctype html><html><head>
		<meta name="description" content="Write to hello@go-firefly.com" />
		<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Ubuntu" />
		<script src="https://cdn.jsdelivr.net/npm/modernizr@2.6.1/modernizr.min.js"></script>
		<script src="https://static.hotjar.com/c/hotjar-1084213.js"></script>
		<script>heap.load("1732739567"); window.hjid = 1084213; document.cookie = 'seen=1';</script>
		<script src="https://consent.cookiebot.com/uc.js"></script>
	</head><body>
		<a href="mailto:hello@go-firefly.com">Email me</a>
		<img src="https://go-firefly.imgix.net/oesa.png" srcset="https://go-firefly.imgix.net/oesa.png 2x" />
		<iframe src="https://nydame.typeform.com/to/cOYwsz"></iframe>
	</body></html>`;

	const OFFENDING_SURFACE = codeSurfaceOf(OFFENDING_PAGE, ORIGIN);

	it('finds a mailto: link', () => {
		expect(mailtoLinksIn(OFFENDING_PAGE)).toEqual(['mailto:hello@go-firefly.com']);
	});

	it('finds a plain-text address in prose and in metadata alike', () => {
		expect(emailAddressesIn(OFFENDING_PAGE)).toContain('hello@go-firefly.com');
	});

	it('finds every retired third party, by host, by API, and by account id', () => {
		expect(retiredThirdPartiesIn(OFFENDING_SURFACE).sort()).toEqual(['Heap', 'Hotjar', 'Modernizr', 'Typeform']);
	});

	it('finds consent machinery, and the cookie API behind it', () => {
		expect(consentMachineryIn(OFFENDING_SURFACE).sort()).toEqual(['Cookiebot', 'the cookie API']);
	});

	it('finds what a page loads, including a frame, a srcset candidate, and a stylesheet', () => {
		const origins = subresourceUrlsIn(OFFENDING_PAGE, ORIGIN).map((url) => url.origin);

		expect(new Set(origins)).toEqual(
			new Set(['https://fonts.googleapis.com', 'https://cdn.jsdelivr.net', 'https://static.hotjar.com', 'https://consent.cookiebot.com', 'https://go-firefly.imgix.net', 'https://nydame.typeform.com']),
		);
	});

	it('reads a same-origin page as loading nothing from anywhere else', () => {
		const clean = '<img src="/_astro/oesa.png" /><script src="/_astro/page.js"></script><a href="https://gist.github.com/x">a link, not a load</a>';

		expect(subresourceUrlsIn(clean, ORIGIN).map((url) => url.origin)).toEqual([ORIGIN, ORIGIN]);
	});

	// The rule is what a page loads, not what it says: the migration is a thing
	// the practitioner may well write a Post about.
	it('reads a Post that names the retired trackers in its prose as clean', () => {
		const post = '<main><p>The 2016 site ran Heap and Hotjar on every page, and its Hire page was a Typeform embed. None of them came back.</p></main>';

		expect(retiredThirdPartiesIn(codeSurfaceOf(post, ORIGIN))).toEqual([]);
		expect(consentMachineryIn(codeSurfaceOf('<p>Why this site needs no cookie consent banner.</p>', ORIGIN))).toEqual([]);
	});
});
