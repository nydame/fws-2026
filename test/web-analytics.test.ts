import { beforeAll, describe, expect, it } from 'vitest';
import { type BuiltPage, fetchPages } from './built-pages';
import { renderedRoutes } from './built-routes';
import { beaconConfig } from '../src/lib/web-analytics';

// Cloudflare Web Analytics is the whole of the site's measurement (issue #14,
// spec #1, docs/adr/0002-cloudflare-web-analytics.md): one beacon that sets no
// cookie and identifies nobody, in place of the 2016 site's Heap and Hotjar.
//
// The token is baked in at build, so the suite builds the site with one — see
// `PUBLIC_CF_BEACON_TOKEN` in package.json's `test` script — and reads the
// beacon a deployed build would carry. The fixture builds beside it are given
// no token on purpose: what an untokened build renders is `beaconConfig`'s
// business, at the bottom of this file. Nothing here asserts the token's
// value; what matters is that every page carries a beacon configured at all.
//
// Swept over every page reachable by a GET, the 404 included. The Client
// Inquiry endpoint's error renders are left to test/privacy.test.ts: what
// those pages must not do is a promise; being counted is not.

// Written out rather than imported from src/lib/web-analytics.ts: this is
// Cloudflare's published snippet, and a test that read the URL from the code
// could never disagree with it.
const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

let pageAt: (route: string) => BuiltPage;

beforeAll(async () => {
	pageAt = await fetchPages(renderedRoutes);
});

/** The opening tags of every `<script>` on a page that loads the beacon. */
function beaconTagsIn(html: string): string[] {
	return [...html.matchAll(/<script\b[^>]*>/gi)].map((m) => m[0]).filter((tag) => tag.includes(BEACON_SRC));
}

/** An attribute's value, as the browser reads it — HTML entities and all. */
function attributeOf(tag: string, name: string): string | undefined {
	const raw = new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];
	return raw?.replaceAll('&quot;', '"').replaceAll('&#38;', '&').replaceAll('&amp;', '&');
}

describe('Cloudflare Web Analytics', () => {
	it.each(renderedRoutes)('%s loads the beacon exactly once', (route) => {
		expect(beaconTagsIn(pageAt(route).html)).toHaveLength(1);
	});

	it.each(renderedRoutes)('%s configures the beacon with a token', (route) => {
		const [beacon] = beaconTagsIn(pageAt(route).html);

		const config = JSON.parse(attributeOf(beacon, 'data-cf-beacon') ?? 'null');
		expect(typeof config?.token).toBe('string');
		expect(config.token).not.toBe('');
	});

	it.each(renderedRoutes)('%s defers the beacon, so measuring never delays the page', (route) => {
		expect(beaconTagsIn(pageAt(route).html)[0]).toMatch(/\sdefer\b/);
	});
});

describe('beaconConfig', () => {
	it('carries the token it is given, as the beacon expects to read it', () => {
		expect(JSON.parse(beaconConfig('a-real-token') ?? 'null')).toEqual({ token: 'a-real-token' });
	});

	// The privacy-safe default: a build nobody gave a token to — a local build,
	// a preview, a fork — measures nothing rather than beaconing under a token
	// that isn't its own.
	it('is nothing at all when no token is configured', () => {
		expect(beaconConfig(undefined)).toBeNull();
		expect(beaconConfig('')).toBeNull();
	});
});
