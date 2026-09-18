import { answerOutbound } from './outbound';

// Cloudflare Turnstile as the endpoint sees it: one outbound call to
// siteverify, answered at the fetch layer (see test/outbound.ts).

export const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** The form field the Turnstile widget adds to the form it sits in. */
export const TOKEN_FIELD = 'cf-turnstile-response';

/** What the endpoint sent to siteverify, as the form fields it posted. */
export type SiteverifyCall = Record<string, string>;

/** Makes siteverify answer every token with `success`, and records each call. */
export function siteverifyAnswers(success: boolean): SiteverifyCall[] {
	const calls: SiteverifyCall[] = [];

	answerOutbound(SITEVERIFY, async (request) => {
		calls.push(Object.fromEntries(new URLSearchParams(await request.text())));
		return Response.json(success ? { success, 'error-codes': [] } : { success, 'error-codes': ['invalid-input-response'] });
	});

	return calls;
}

/** Makes siteverify unreachable, as when Cloudflare's API is down. */
export function siteverifyIsDown(): void {
	answerOutbound(SITEVERIFY, async () => {
		throw new TypeError('Network connection lost.');
	});
}
