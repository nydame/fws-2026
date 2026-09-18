// A Client Inquiry: a message from a Prospective Client sent through the
// site, asking about paid work (CONTEXT.md). Everything the endpoint needs to
// turn a form post into a stored row — the page itself only decides which
// response to send.

export const INQUIRY_FIELDS = ['name', 'email', 'organization', 'message'] as const;
export type InquiryField = (typeof INQUIRY_FIELDS)[number];

/** A Client Inquiry as submitted: trimmed strings, blank where left empty. */
export type InquiryValues = Record<InquiryField, string>;
/** A message for each field that needs fixing; absent means the field is fine. */
export type FieldErrors = Partial<Record<InquiryField, string>>;

export const BLANK_INQUIRY: InquiryValues = { name: '', email: '', organization: '', message: '' };

/** Enforced here and mirrored as `maxlength` on the form. */
export const MAX_LENGTH: Record<InquiryField, number> = {
	name: 200,
	// The longest address SMTP can carry.
	email: 254,
	organization: 200,
	message: 10_000,
};

// Deliberately loose: something on each side of one @, and a dot in the
// domain. The real test of an address is whether a reply arrives; this only
// catches the typos that make a reply impossible.
const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Reads a form post's body once, for both the Client Inquiry and the
 * Turnstile token. A body that isn't form data reads as `null` rather than a
 * crash.
 */
export async function readForm(request: Request): Promise<FormData | null> {
	try {
		return await request.formData();
	} catch {
		return null;
	}
}

/**
 * Reads a Client Inquiry from a form post. A missing form reads as a blank
 * inquiry, which validation then rejects.
 */
export function readInquiry(form: FormData | null): InquiryValues {
	const values = { ...BLANK_INQUIRY };
	for (const field of INQUIRY_FIELDS) {
		const value = form?.get(field);
		values[field] = typeof value === 'string' ? value.trim() : '';
	}
	return values;
}

export function validateInquiry(values: InquiryValues): FieldErrors {
	const errors: FieldErrors = {};

	if (!values.name) errors.name = 'Please tell me your name.';

	if (!values.email) errors.email = 'I need an email address to reply to.';
	else if (!EMAIL_SHAPE.test(values.email)) errors.email = 'That doesn’t look like an email address. Is there a typo?';

	if (!values.message) errors.message = 'Please tell me a little about what you need.';

	for (const field of INQUIRY_FIELDS) {
		if (!errors[field] && values[field].length > MAX_LENGTH[field]) {
			errors[field] = `Please keep this under ${MAX_LENGTH[field].toLocaleString('en-US')} characters.`;
		}
	}

	return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
	return Object.keys(errors).length > 0;
}

/**
 * Stores a validated Client Inquiry. Throws if the row isn't written, so the
 * caller can never mistake a lost inquiry for a stored one.
 */
export async function storeInquiry(db: D1Database, values: InquiryValues): Promise<void> {
	await db
		.prepare(
			'INSERT INTO client_inquiries (submitted_at, name, email, organization, message) VALUES (?, ?, ?, ?, ?)',
		)
		.bind(new Date().toISOString(), values.name, values.email, values.organization || null, values.message)
		.run();
}
