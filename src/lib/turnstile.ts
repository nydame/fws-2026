// Cloudflare Turnstile, checked server-side before a Client Inquiry is
// stored (docs/adr/0001-client-inquiry-pipeline.md). The widget on the Hire
// page only produces a token; nothing is trusted until siteverify says the
// token is good.

const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/** The form field the Turnstile widget adds to the form it sits in. */
export const TOKEN_FIELD = 'cf-turnstile-response';

/**
 * Cloudflare's always-pass test site key, for builds that aren't given a real
 * one. It is public by design, like any site key. A production build without
 * PUBLIC_TURNSTILE_SITE_KEY fails safe: the widget's dummy token is rejected
 * by the real secret, so no inquiry gets through unverified.
 */
const TEST_SITE_KEY = '1x00000000000000000000AA';

/** The site key the widget renders with, baked in at build. */
export const SITE_KEY: string = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || TEST_SITE_KEY;

/**
 * Whether a form post carries a Turnstile token that siteverify accepts.
 * Fails closed: a missing token, a missing secret, or an unreachable
 * siteverify all count as not verified.
 */
export async function verifyTurnstile(form: FormData | null, secret: string | undefined): Promise<boolean> {
	const token = form?.get(TOKEN_FIELD);
	if (typeof token !== 'string' || !token) return false;

	if (!secret) {
		console.error('TURNSTILE_SECRET_KEY is not set; every Client Inquiry will be rejected.');
		return false;
	}

	try {
		// No `remoteip`: it's optional, and the visitor's address isn't ours to pass on.
		const response = await fetch(SITEVERIFY, { method: 'POST', body: new URLSearchParams({ secret, response: token }) });
		const outcome: { success?: unknown; 'error-codes'?: unknown } = await response.json();
		if (outcome.success === true) return true;
		// The reason stays in the log; the Prospective Client is never told it.
		console.warn('Turnstile rejected a Client Inquiry:', outcome['error-codes']);
		return false;
	} catch (error) {
		console.error('Turnstile siteverify could not be reached:', error);
		return false;
	}
}
