import { describe, expect, it } from 'vitest';
import { legacyRouteFor } from '../src/lib/legacy-query-routes';

// The 2016 site served every page from the root as a query string, in two
// forms per page, one of them percent-encoded (see
// docs/research/pico-to-astro-migration.md §7). These are the URLs an old
// bookmark or backlink actually carries.
describe('legacyRouteFor', () => {
	it.each([
		['?about', '/about/'],
		['?hire', '/hire/'],
		['?index', '/'],
	])('routes the bare legacy form %s to %s', (search, expected) => {
		expect(legacyRouteFor(search)).toBe(expected);
	});

	it.each([
		['?about/index', '/about/'],
		['?hire/index', '/hire/'],
	])('routes the redundant /index form %s to %s', (search, expected) => {
		expect(legacyRouteFor(search)).toBe(expected);
	});

	it.each([
		['?about%2Findex', '/about/'],
		['?hire%2Findex', '/hire/'],
	])('routes the percent-encoded form %s that the old nav emitted', (search, expected) => {
		expect(legacyRouteFor(search)).toBe(expected);
	});

	it.each([
		['?about/', '/about/'],
		['?about/index/', '/about/'],
		['?hire/index/', '/hire/'],
	])('ignores a trailing slash on %s', (search, expected) => {
		expect(legacyRouteFor(search)).toBe(expected);
	});

	// Best-effort courtesy, not a guarantee: anything it does not recognise
	// leaves the visitor where they are rather than guessing at a route.
	it.each([
		['', 'no query string at all'],
		['?', 'an empty query string'],
		['?utm_source=newsletter', 'an ordinary tracking parameter'],
		['?work', 'a path that was never a 2016 page'],
		['?about=1', 'a key=value pair that merely looks like a page'],
		['?%E0%A4%A', 'a malformed percent-encoding'],
		// Inherited Object properties are not routes. `?constructor` and
		// `?__proto__` are already lowercase, so nothing else in the lookup
		// filters them out.
		['?constructor', 'an inherited property name'],
		['?__proto__', 'the prototype accessor'],
	])('returns null for %s (%s)', (search) => {
		expect(legacyRouteFor(search)).toBeNull();
	});

	// The signature promises a path or nothing; a prototype lookup would
	// satisfy neither while still being truthy enough to navigate to.
	it.each(['?constructor', '?__proto__', '?about'])('only ever returns a string or null for %s', (search) => {
		const route = legacyRouteFor(search);
		expect(route === null || typeof route === 'string').toBe(true);
	});
});
