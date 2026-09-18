import { afterEach, vi } from 'vitest';

// Cloudflare Turnstile as the endpoint sees it: one outbound call to
// siteverify. Intercepted at the fetch layer, the only place a test can stand
// in for Cloudflare without reaching inside the endpoint. The built worker
// runs in the same isolate as the tests, so its `fetch` is this one.

export const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** The form field the Turnstile widget adds to the form it sits in. */
export const TOKEN_FIELD = 'cf-turnstile-response';

/** What the endpoint sent to siteverify, as the form fields it posted. */
export type SiteverifyCall = Record<string, string>;

afterEach(() => {
	vi.restoreAllMocks();
});

/**
 * Makes siteverify answer every token with `success`, and records each call.
 * Any other outbound request fails the test: nothing else should leave the
 * worker.
 */
export function siteverifyAnswers(success: boolean): SiteverifyCall[] {
	const calls: SiteverifyCall[] = [];

	vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
		const request = new Request(input, init);
		if (request.url !== SITEVERIFY) throw new Error(`Unexpected outbound request to ${request.url}`);

		calls.push(Object.fromEntries(new URLSearchParams(await request.text())));
		return Response.json(success ? { success, 'error-codes': [] } : { success, 'error-codes': ['invalid-input-response'] });
	});

	return calls;
}

/** Makes siteverify unreachable, as when Cloudflare's API is down. */
export function siteverifyIsDown(): void {
	vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Network connection lost.'));
}
