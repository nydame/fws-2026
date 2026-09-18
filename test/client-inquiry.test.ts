import { env, SELF } from 'cloudflare:test';
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { escapeHtml } from './content-fixtures';
import { controlNamed, inquiryFormIn, type RenderedForm, renderedValue } from './inquiry-form';
import { h1Count, h1TextOf } from './page-text';

// The Client Inquiry endpoint's contract, through the one seam: a request to
// the built worker, and a real local D1 read back afterwards. The error paths
// matter as much as the success path — a Prospective Client who mistypes an
// email address must not lose what they wrote.

interface Row {
	id: number;
	submitted_at: string;
	name: string;
	email: string;
	organization: string | null;
	message: string;
	notification_status: string;
}

// Declared here rather than imported from src/lib/client-inquiry.ts: the
// tests treat the endpoint as a black box, and the field names they send
// come from the rendered form, not from the code under test.
type Fields = Record<'name' | 'email' | 'organization' | 'message', string>;

// Markup-significant characters and a line break, so the round trip proves
// values are escaped on the way back rather than merely echoed.
const VALID: Fields = {
	name: 'Ada Okafor',
	email: 'ada@example.org',
	organization: 'Tenants & Neighbors of "East Oakland"',
	message: 'Our site runs on PHP from 2014.\nCan you <help> us move it?',
};

let hireForm: RenderedForm;

beforeAll(async () => {
	hireForm = inquiryFormIn(await (await SELF.fetch('https://example.com/hire/')).text());
});

beforeEach(async () => {
	await env.DB.exec('DELETE FROM client_inquiries');
});

const SITE = 'https://example.com';

/**
 * Submits the /hire/ form the way a browser without JavaScript does: every
 * field the form names, urlencoded, to the form's own action — with the
 * `Origin` header a browser always sends on a form post, which Astro's
 * cross-site request check requires.
 */
function submit(fields: Partial<Fields>, origin = SITE) {
	const body = new URLSearchParams();
	for (const name of hireForm.fieldNames) body.set(name, fields[name as keyof Fields] ?? '');

	return SELF.fetch(new URL(hireForm.action, SITE), {
		method: hireForm.method.toUpperCase(),
		headers: { origin },
		body,
		redirect: 'manual',
	});
}

/** Where a redirect points, as a path on this site. */
function locationPathOf(response: Response): string {
	return new URL(response.headers.get('location') ?? '', SITE).pathname;
}

async function rows(): Promise<Row[]> {
	return (await env.DB.prepare('SELECT * FROM client_inquiries').all<Row>()).results;
}

/** Asserts every submitted value is back in the form, escaped, so nothing is retyped. */
function expectValuesPreserved(page: string, fields: Fields): void {
	const form = inquiryFormIn(page);
	for (const [name, value] of Object.entries(fields)) {
		expect(renderedValue(form, name), `${name} was not preserved`).toBe(escapeHtml(value));
	}
}

describe('a valid Client Inquiry', () => {
	it('redirects to the confirmation page', async () => {
		const response = await submit(VALID);

		expect(response.status).toBe(303);
		expect(locationPathOf(response)).toBe('/hire/received/');
	});

	it('leaves exactly one row in D1 with the submitted values', async () => {
		const before = Date.now();
		await submit(VALID);

		const stored = await rows();
		expect(stored).toHaveLength(1);
		expect(stored[0]).toMatchObject({ ...VALID, notification_status: 'pending' });

		const submittedAt = Date.parse(stored[0].submitted_at);
		expect(submittedAt).toBeGreaterThanOrEqual(before - 1000);
		expect(submittedAt).toBeLessThanOrEqual(Date.now() + 1000);
	});

	it('stores a blank organization as absent rather than empty', async () => {
		await submit({ ...VALID, organization: '' });

		expect((await rows())[0].organization).toBeNull();
	});

	it('is stored without the surrounding whitespace a form picks up', async () => {
		await submit({ ...VALID, name: `  ${VALID.name}  `, email: ` ${VALID.email}\n` });

		expect((await rows())[0]).toMatchObject({ name: VALID.name, email: VALID.email });
	});
});

describe('the confirmation page', () => {
	it('tells the Prospective Client plainly that the inquiry was received', async () => {
		const response = await SELF.fetch('https://example.com/hire/received/');
		const page = await response.text();

		expect(response.status).toBe(200);
		expect(h1Count(page)).toBe(1);
		expect(h1TextOf(page)).toMatch(/received/i);
	});
});

describe('an invalid Client Inquiry', () => {
	const cases: [string, Partial<Fields>, keyof Fields][] = [
		['a missing name', { name: '' }, 'name'],
		['a whitespace-only name', { name: '   ' }, 'name'],
		['a missing email address', { email: '' }, 'email'],
		['a mistyped email address', { email: 'ada-at-example.org' }, 'email'],
		['an email address with no domain', { email: 'ada@' }, 'email'],
		['a missing message', { message: '' }, 'message'],
		['a name past the length limit', { name: 'x'.repeat(201) }, 'name'],
		['a message past the length limit', { message: 'x'.repeat(10_001) }, 'message'],
	];

	it.each(cases)('with %s returns 422 and writes no row', async (_, override) => {
		const response = await submit({ ...VALID, ...override });

		expect(response.status).toBe(422);
		expect(await rows()).toEqual([]);
	});

	it.each(cases)('with %s says which field is wrong, and only that one', async (_, override, field) => {
		const form = inquiryFormIn(await (await submit({ ...VALID, ...override })).text());

		for (const name of form.fieldNames) {
			const control = controlNamed(form, name);
			if (name === field) {
				expect(control).toContain('aria-invalid="true"');
				const describedBy = /\baria-describedby="([^"]+)"/.exec(control)?.[1];
				expect(describedBy, `${name} has no linked message`).toBeDefined();
				expect(form.html).toMatch(new RegExp(`id="${describedBy}"[^>]*>[^<]*\\S`));
			} else {
				expect(control, `${name} was marked invalid`).not.toContain('aria-invalid');
			}
		}
	});

	it('preserves every submitted value, so nothing is retyped', async () => {
		const submitted = { ...VALID, email: 'ada-at-example.org' };
		const page = await (await submit(submitted)).text();

		expectValuesPreserved(page, submitted);
	});

	it('renders a whole page with exactly one <h1>', async () => {
		expect(h1Count(await (await submit({ ...VALID, email: '' })).text())).toBe(1);
	});

	it('treats a body that is not a form post as an invalid inquiry, not a crash', async () => {
		const response = await SELF.fetch('https://example.com/hire/inquiry/', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify(VALID),
			redirect: 'manual',
		});

		expect(response.status).toBe(422);
		expect(await rows()).toEqual([]);
	});
});

describe('a storage failure', () => {
	// A real failure through the real seam: the endpoint's table disappears
	// for the duration of the request, then comes back.
	async function whileStorageIsDown<T>(run: () => Promise<T>): Promise<T> {
		await env.DB.exec('ALTER TABLE client_inquiries RENAME TO client_inquiries_offline');
		try {
			return await run();
		} finally {
			await env.DB.exec('ALTER TABLE client_inquiries_offline RENAME TO client_inquiries');
		}
	}

	it('returns an honest error rather than claiming success', async () => {
		const response = await whileStorageIsDown(() => submit(VALID));

		expect(response.status).toBeGreaterThanOrEqual(500);
		expect(response.headers.get('location')).toBeNull();
		expect(await rows()).toEqual([]);
	});

	it('says so on a whole page, and keeps what was written', async () => {
		const response = await whileStorageIsDown(() => submit(VALID));
		const page = await response.text();

		expect(h1Count(page)).toBe(1);
		expect(page).toMatch(/role="alert"/);
		expectValuesPreserved(page, VALID);
	});
});

describe('the endpoint outside a form post', () => {
	// Astro's `security.checkOrigin`, on by default: another site can't submit
	// a Client Inquiry through a visitor's browser.
	it('refuses a form post from another origin and writes no row', async () => {
		const response = await submit(VALID, 'https://elsewhere.example');

		expect(response.status).toBe(403);
		expect(await rows()).toEqual([]);
	});

	it('sends a GET back to the Hire page instead of rendering an empty result', async () => {
		const response = await SELF.fetch('https://example.com/hire/inquiry/', { redirect: 'manual' });

		expect([301, 302, 303, 307, 308]).toContain(response.status);
		expect(locationPathOf(response)).toBe('/hire/');
	});
});
