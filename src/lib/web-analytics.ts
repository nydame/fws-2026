// Cloudflare Web Analytics, the site's only measurement
// (docs/adr/0002-cloudflare-web-analytics.md). It reports page views without a
// cookie, without local storage, and without anything that could identify a
// visitor across sites — so there is nothing to consent to, and no banner.
//
// Heap (`1732739567`) and Hotjar (`1084213`) ran on every page of the 2016
// site and are not carried over. test/privacy.test.ts is what keeps them out.

/** Cloudflare's beacon, from its Web Analytics snippet. */
export const BEACON_SRC = 'https://static.cloudflareinsights.com/beacon.min.js';

/**
 * What the beacon reads its site token from, or `null` for a build that was
 * given no token — a local build, a fork, a preview — which then carries no
 * beacon at all and reports nothing anywhere.
 */
export function beaconConfig(token: string | undefined): string | null {
	return token ? JSON.stringify({ token }) : null;
}

/**
 * The token the deployed site measures under, baked in at build.
 * It is public by design: it names the site in the beacon's own markup.
 */
export const BEACON_CONFIG: string | null = beaconConfig(import.meta.env.PUBLIC_CF_BEACON_TOKEN);
