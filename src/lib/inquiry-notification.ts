// Tells the practitioner a Client Inquiry has arrived, by email through
// Resend (docs/adr/0001-client-inquiry-pipeline.md). Workers can't send
// outbound mail on their own — Cloudflare Email Routing is inbound only — so
// a third-party API is in the path at all.
//
// Only ever called once the row is in D1. A notification that fails is
// recorded against that row, never passed on to the Prospective Client: the
// inquiry is already safe, and a failure to notify must never cost it.

import { type InquiryValues, recordNotification } from './client-inquiry';

const RESEND_EMAILS = 'https://api.resend.com/emails';

/** Long enough for Resend on a bad day; short enough that a Prospective Client isn't left waiting on it. */
const SEND_TIMEOUT_MS = 5_000;

/** The Worker's configuration for notifying: one secret and two addresses. */
export interface NotificationConfig {
	RESEND_API_KEY?: string;
	/** A sender on a domain verified in Resend, e.g. `Inquiries <inquiries@example.com>`. */
	INQUIRY_NOTIFICATION_FROM?: string;
	/** Where the practitioner reads Client Inquiries. */
	INQUIRY_NOTIFICATION_TO?: string;
}

/**
 * Notifies the practitioner of the stored Client Inquiry `id`, then records
 * the outcome on its row. Never throws: every failure is logged and left
 * visible as `notification_status = 'failed'`.
 */
export async function notifyOfInquiry(
	db: D1Database,
	config: NotificationConfig,
	id: number,
	values: InquiryValues,
): Promise<void> {
	const status = (await sendNotification(config, id, values)) ? 'sent' : 'failed';

	try {
		await recordNotification(db, id, status);
	} catch (error) {
		// The row stays `pending`, which is still visibly not `sent`.
		console.error(`Client Inquiry ${id}'s notification status could not be recorded:`, error);
	}
}

async function sendNotification(config: NotificationConfig, id: number, values: InquiryValues): Promise<boolean> {
	const { RESEND_API_KEY: key, INQUIRY_NOTIFICATION_FROM: from, INQUIRY_NOTIFICATION_TO: to } = config;
	if (!key || !from || !to) {
		console.error(
			'RESEND_API_KEY, INQUIRY_NOTIFICATION_FROM, and INQUIRY_NOTIFICATION_TO must all be set; ' +
				`Client Inquiry ${id} was stored but not notified.`,
		);
		return false;
	}

	try {
		const response = await fetch(RESEND_EMAILS, {
			method: 'POST',
			headers: {
				authorization: `Bearer ${key}`,
				'content-type': 'application/json',
			},
			body: JSON.stringify({ from, to: [to], reply_to: values.email, ...notificationFor(values) }),
			signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
		});
		if (response.ok) return true;

		// Resend's error body names the problem, not the inquiry, so it's safe to log.
		console.error(`Resend refused Client Inquiry ${id}'s notification (${response.status}):`, await response.text());
		return false;
	} catch (error) {
		console.error(`Resend could not be reached for Client Inquiry ${id}'s notification:`, error);
		return false;
	}
}

/**
 * The email itself: plain text, with everything needed to act on it — who,
 * their organization, and what they said. Replying goes straight to them.
 */
function notificationFor(values: InquiryValues): { subject: string; text: string } {
	// A form field can carry line breaks; a subject line can't.
	const name = values.name.replace(/\s+/g, ' ');

	return {
		subject: `New FWS inquiry from ${name}`,
		text: [
			`Name: ${values.name}`,
			`Email: ${values.email}`,
			`Organization: ${values.organization || '(none given)'}`,
			'',
			values.message,
			'',
			'—',
			'Reply to this email to answer them directly.',
		].join('\n'),
	};
}
