import { SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { type BuiltPage, fetchPages, ORIGIN } from './built-pages';
import { builtRoutes } from './built-routes';

// The firefly mark and the fonts (issue #12), checked on every built page.
// How the site looks is left to review on the preview URL (spec #1, "What is
// not tested"); what is checked here is what a visitor's browser receives:
// which requests a page makes, and what its markup exposes.

let builtPage: (route: string) => BuiltPage;

beforeAll(async () => {
	builtPage = await fetchPages(builtRoutes);
});

function pageAt(route: string): string {
	return builtPage(route).html;
}

function headerOf(html: string): string {
	const matched = /<header[^>]*>([\s\S]*?)<\/header>/.exec(html);
	if (!matched) throw new Error('No <header> in the page');
	return matched[1];
}

/** Every inline `<svg>…</svg>` in a fragment. */
function svgsIn(fragment: string): string[] {
	return fragment.match(/<svg[\s\S]*?<\/svg>/g) ?? [];
}

/** The path data of an SVG, in document order: what makes it the same drawing. */
function pathDataOf(svg: string): string[] {
	return [...svg.matchAll(/<path[^>]*\sd="([^"]+)"/g)].map((m) => m[1]);
}

function iconLinksOf(html: string): string[] {
	return (html.match(/<link[^>]+rel="(?:shortcut )?icon"[^>]*>/g) ?? []);
}

function hrefOf(tag: string): string {
	const matched = /\shref="([^"]+)"/.exec(tag);
	if (!matched) throw new Error(`No href in ${tag}`);
	return matched[1];
}

/** The `url(...)` sources of every `@font-face` rule in the page's inline styles. */
function fontFaceSourcesOf(html: string): string[] {
	const faces = html.match(/@font-face\s*{[^}]*}/g) ?? [];
	return faces.flatMap((face) => [...face.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)].map((m) => m[1]));
}

describe('the firefly mark', () => {
	it.each(builtRoutes)('%s inlines the mark in its header, not as an <img>', (route) => {
		const header = headerOf(pageAt(route));

		expect(svgsIn(header)).toHaveLength(1);
		expect(header).not.toMatch(/<img[\s>]/);
	});

	it.each(builtRoutes)('%s gives every inline mark a name or hides it from assistive technology', (route) => {
		for (const svg of svgsIn(pageAt(route))) {
			const open = /<svg[^>]*>/.exec(svg)?.[0] ?? '';
			const hidden = /\saria-hidden="true"/.test(open);
			const named = /<title>[^<]+<\/title>/.test(svg) || (/\srole="img"/.test(open) && /\saria-label="[^"]+"/.test(open));
			expect(hidden || named, `an unnamed, unhidden <svg> on ${route}`).toBe(true);
		}
	});

	it('draws its outline in currentColor, so it takes the colour of whatever band it sits in', () => {
		const [mark] = svgsIn(headerOf(pageAt('/')));

		expect(mark).toMatch(/fill="currentColor"/);
	});

	it('carries a <title> in the file itself', async () => {
		const [link] = iconLinksOf(pageAt('/'));
		const favicon = await (await SELF.fetch(new URL(hrefOf(link), ORIGIN))).text();

		expect(favicon).toMatch(/<title>[^<]+<\/title>/);
	});

	it.each(builtRoutes)('%s uses the mark as its only favicon', async (route) => {
		const html = pageAt(route);
		const links = iconLinksOf(html);
		expect(links).toHaveLength(1);
		expect(links[0]).toMatch(/type="image\/svg\+xml"/);

		const response = await SELF.fetch(new URL(hrefOf(links[0]), ORIGIN));
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toMatch(/^image\/svg\+xml/);

		// Same drawing, same file: the favicon's paths are the inline mark's paths.
		const [mark] = svgsIn(headerOf(html));
		const markPaths = pathDataOf(mark);
		expect(markPaths.length).toBeGreaterThan(0);
		expect(pathDataOf(await response.text())).toEqual(markPaths);
	});
});

describe('fonts', () => {
	// The 2016 site loaded Google Fonts, Typekit kit teb7vha, and a self-hosted
	// Ubuntu webfont set all at once (docs/research/pico-to-astro-migration.md).
	const LEGACY_FONT_SOURCES = [/fonts\.googleapis\.com/, /fonts\.gstatic\.com/, /typekit\.(?:net|com)/, /ubuntu-v\d/i, /font-family:[^;"]*\bUbuntu\b/i];

	it.each(builtRoutes)('%s loads none of the 2016 font sources', (route) => {
		const html = pageAt(route);

		for (const source of LEGACY_FONT_SOURCES) expect(html).not.toMatch(source);
	});

	it.each(builtRoutes)('%s requests no stylesheet or font from another origin', (route) => {
		const html = pageAt(route);
		const linked = (html.match(/<link[^>]+rel="(?:stylesheet|preload|preconnect)"[^>]*>/g) ?? []).map(hrefOf);
		const imported = [...html.matchAll(/@import\s+(?:url\()?\s*["']?([^"');]+)/g)].map((m) => m[1]);

		for (const url of [...linked, ...imported, ...fontFaceSourcesOf(html)]) {
			expect(new URL(url, ORIGIN).origin, url).toBe(ORIGIN);
		}
	});

	it('serves the site typeface from the site itself', async () => {
		const sources = fontFaceSourcesOf(pageAt('/'));
		expect(sources.length).toBeGreaterThan(0);

		for (const source of sources) {
			const response = await SELF.fetch(new URL(source, ORIGIN));
			expect(response.status, source).toBe(200);
			expect(response.headers.get('content-type'), source).toMatch(/^font\//);
		}
	});
});
