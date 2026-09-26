// The 2016 site had no clean URLs. `mod_rewrite` was never switched on, so
// Pico served every page from the root as a query string — `?about`, and the
// redundant `?about/index` the old nav actually emitted, percent-encoded as
// `?about%2Findex` (docs/research/pico-to-astro-migration.md §7).
//
// Astro's `redirects` config cannot express this: its keys are pathnames, so
// a query string is invisible to it. Hence a client-side shim on the home
// page, which is where every one of these URLs lands.
//
// This is a courtesy to old bookmarks and backlinks, not a guarantee — those
// URLs were uncanonicalized and duplicated across two forms to begin with.
const LEGACY_ROUTES: Record<string, string> = {
	index: '/',
	about: '/about/',
	hire: '/hire/',
};

/**
 * Maps a 2016 query-string URL to its route on this site.
 *
 * @param search `location.search`, leading `?` and all.
 * @returns The path to send the visitor to, or `null` to leave them alone.
 */
export function legacyRouteFor(search: string): string | null {
	const raw = search.replace(/^\?/, '');
	if (!raw) return null;

	// An ordinary query string — a tracking parameter, a form submission — is
	// not a 2016 page reference, and must not be read as one.
	if (raw.includes('=') || raw.includes('&')) return null;

	let decoded: string;
	try {
		decoded = decodeURIComponent(raw);
	} catch {
		// A malformed percent-encoding throws. Leave the visitor where they are.
		return null;
	}

	// `?about`, `?about/`, `?about/index` and `?about/index/` were all the
	// same Pico page. Trailing slashes come off first, so that `/index` is
	// still at the end when it is stripped.
	const page = decoded.toLowerCase().replace(/\/+$/, '').replace(/\/index$/, '');

	// `hasOwn`, not a bare lookup: `?constructor` and `?__proto__` are
	// already lowercase, so a plain-object lookup would hand back an
	// inherited value — truthy, not a path, and navigated to.
	return Object.hasOwn(LEGACY_ROUTES, page) ? LEGACY_ROUTES[page] : null;
}
