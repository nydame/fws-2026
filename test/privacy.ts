// Detectors for the things a rendered page must never contain (issue #14):
// the 2016 site's third-party baggage, an address for a scraper to harvest,
// and anything that would need a cookie banner.
//
// Each one reports what it found rather than asserting, so the sweep can name
// the offender, and so test/privacy.test.ts can prove on a page written to
// break every rule that these detectors actually fire.

/** Every `mailto:` URL on a page, wherever it appears. */
export function mailtoLinksIn(html: string): string[] {
	return [...html.matchAll(/mailto:[^"'\s>)]*/gi)].map((match) => match[0]);
}

/**
 * Every plain-text email address on a page — the whole document, not just its
 * prose: an address in a meta description or a data attribute is just as
 * harvestable as one in a paragraph.
 */
export function emailAddressesIn(html: string): string[] {
	return [...html.matchAll(/[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g)].map((match) => match[0]);
}

/**
 * Every URL a page makes the browser fetch — scripts, styles, fonts, images,
 * frames, media — resolved against the page's own origin. Link targets are
 * not among them: a page may link anywhere, but what it *loads* is what
 * reaches a visitor's browser without their asking.
 */
export function subresourceUrlsIn(html: string, origin: string): URL[] {
	const tags = html.match(/<(?:script|link|img|source|iframe|frame|embed|object|video|audio|track)\b[^>]*>/gi) ?? [];
	const urls = tags.flatMap((tag) => {
		if (/^<link\b/i.test(tag) && !/\brel="(?:stylesheet|preload|modulepreload|prefetch|preconnect|dns-prefetch|icon|shortcut icon)"/i.test(tag)) return [];
		const attributes = [/\bsrc="([^"]+)"/, /\bhref="([^"]+)"/, /\bdata="([^"]+)"/].flatMap((pattern) => pattern.exec(tag)?.[1] ?? []);
		// A srcset is a comma-separated list of candidates, each "url descriptor".
		const srcset = (/\bsrcset="([^"]+)"/.exec(tag)?.[1] ?? '').split(',').flatMap((candidate) => candidate.trim().split(/\s+/)[0] || []);
		return [...attributes, ...srcset];
	});

	// `data:` and `blob:` reach no network at all; a bare fragment is this page.
	// Anything the URL parser rejects is dropped with them: a browser parses
	// these the same way, so what it can't resolve it never fetches.
	return urls.filter((url) => !/^(?:data|blob):/i.test(url) && !url.startsWith('#')).flatMap((url) => resolved(url, origin));
}

function resolved(url: string, origin: string): URL[] {
	try {
		return [new URL(url, origin)];
	} catch {
		return [];
	}
}

/**
 * Everything on a page that loads or runs: the URLs it fetches, the scripts
 * written into it, and any inline event handler.
 *
 * Deliberately not the prose. A Post is free to say what Hotjar was and why
 * it is gone — the rule is that no page may *load* it — so the brand
 * detectors below read this surface rather than the whole document.
 */
export function codeSurfaceOf(html: string, origin: string): string {
	const urls = subresourceUrlsIn(html, origin).map((url) => url.href);
	const scripts = html.match(/<script\b[^>]*>[\s\S]*?<\/script>/gi) ?? [];
	const handlers = html.match(/\son[a-z]+="[^"]*"/gi) ?? [];

	return [...urls, ...scripts, ...handlers].join('\n');
}

/**
 * The third parties the 2016 site carried, each identified by its hosts, its
 * API, and the account id it ran under
 * (docs/research/pico-to-astro-migration.md). Matching any one of those is
 * enough: an id in a config object is the same regression as a script tag.
 */
const RETIRED_THIRD_PARTIES: Record<string, RegExp[]> = {
	Heap: [/heap(?:analytics)?\.(?:com|io|net)/i, /\bheap\s*\.\s*load\s*\(/i, /\b1732739567\b/],
	Hotjar: [/hotjar/i, /\bhjid\b/i, /\b1084213\b/],
	Typeform: [/typeform/i, /\bcOYwsz\b/],
	// Swept with them because it shipped in the same 2016 `base.html`: a 2012
	// feature-detection library would be liability, not code.
	Modernizr: [/modernizr/i],
};

/** The names of the retired third parties a page's code surface shows. */
export function retiredThirdPartiesIn(surface: string): string[] {
	return namesMatching(RETIRED_THIRD_PARTIES, surface);
}

/**
 * Consent machinery: the platforms a site reaches for once it has something to
 * ask permission for, and the cookie API that would give it something to ask
 * about. A banner is the symptom; these are the causes, and every one of them
 * is code — which is why this reads the code surface too.
 */
const CONSENT_MACHINERY: Record<string, RegExp[]> = {
	Cookiebot: [/cookiebot/i],
	OneTrust: [/onetrust/i, /cookielaw\.org/i],
	Osano: [/osano/i],
	Termly: [/termly/i],
	iubenda: [/iubenda/i],
	CookieYes: [/cookieyes/i],
	Usercentrics: [/usercentrics/i],
	Didomi: [/didomi/i],
	TrustArc: [/trustarc/i],
	Quantcast: [/quantcast/i],
	Klaro: [/klaro/i],
	'a consent banner': [/cookie-?consent/i, /consent-?banner/i],
	'the cookie API': [/document\s*\.\s*cookie/i],
};

/** The names of the consent machinery a page's code surface shows. */
export function consentMachineryIn(surface: string): string[] {
	return namesMatching(CONSENT_MACHINERY, surface);
}

function namesMatching(catalogue: Record<string, RegExp[]>, text: string): string[] {
	return Object.entries(catalogue)
		.filter(([, patterns]) => patterns.some((pattern) => pattern.test(text)))
		.map(([name]) => name);
}
