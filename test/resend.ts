import { env } from 'cloudflare:test';
import { answerOutbound } from './outbound';

// Resend as the endpoint sees it: one outbound call to its send-email API,
// answered at the fetch layer (see test/outbound.ts). No test ever sends mail.

export const RESEND_EMAILS = 'https://api.resend.com/emails';

/** One call the endpoint made to Resend, and what D1 held at that moment. */
export interface ResendCall {
	authorization: string | null;
	email: { from?: string; to?: string | string[]; reply_to?: string | string[]; subject?: string; text?: string };
	/** How many Client Inquiries were stored when the call went out. */
	rowsAtCallTime: number;
}

async function recordCall(request: Request): Promise<ResendCall> {
	const { count } = (await env.DB.prepare('SELECT COUNT(*) AS count FROM client_inquiries').first<{ count: number }>())!;
	return {
		authorization: request.headers.get('authorization'),
		email: await request.json(),
		rowsAtCallTime: count,
	};
}

/** Makes Resend accept every email, and records each call. */
export function resendAccepts(): ResendCall[] {
	const calls: ResendCall[] = [];
	answerOutbound(RESEND_EMAILS, async (request) => {
		calls.push(await recordCall(request));
		return Response.json({ id: crypto.randomUUID() });
	});
	return calls;
}

/** Makes Resend refuse every email with an API error, and records each call. */
export function resendRefuses(status: number): ResendCall[] {
	const calls: ResendCall[] = [];
	answerOutbound(RESEND_EMAILS, async (request) => {
		calls.push(await recordCall(request));
		return Response.json({ statusCode: status, name: 'application_error', message: 'Something went wrong.' }, { status });
	});
	return calls;
}

/** Makes Resend unreachable. */
export function resendIsDown(): void {
	answerOutbound(RESEND_EMAILS, async () => {
		throw new TypeError('Network connection lost.');
	});
}
