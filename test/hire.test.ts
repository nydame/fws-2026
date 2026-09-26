import { SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { controlNamed, inquiryFormIn } from './inquiry-form';
import { expectFirstPersonSingular, expectNoRate, h1Count, mainOf, publishedText, textOf } from './page-text';

// The Hire page replaces a 2016 page that was nothing but a Typeform embed.
// Nothing here asserts on wording: these are the constraints the copy must
// keep, and the proof that the form is a plain HTML form post.
// A Client Inquiry's fields as the form must offer them (issue #9).
const FIELDS = ['email', 'message', 'name', 'organization'];

let status: number;
let html: string;

// Every page the build produced, for the site-wide third-party checks.
const builtPages = import.meta.glob('/dist/client/**/*.html', {
	eager: true,
	query: '?raw',
	import: 'default',
}) as Record<string, string>;

beforeAll(async () => {
	const response = await SELF.fetch('https://example.com/hire/');
	status = response.status;
	html = await response.text();
});

describe('/hire/', () => {
	it('returns 200 and renders exactly one <h1>', () => {
		expect(status).toBe(200);
		expect(h1Count(html)).toBe(1);
	});

	it('explains the engagement in the first person singular', () => {
		expectFirstPersonSingular(textOf(mainOf(html)));
	});

	it('publishes no rate', () => {
		expectNoRate(publishedText(html));
	});

	it('offers one form that posts a Client Inquiry to the endpoint', () => {
		const form = inquiryFormIn(html);

		expect(form.method).toBe('post');
		expect(form.action).toBe('/hire/inquiry/');
		expect([...form.fieldNames].sort()).toEqual(FIELDS);
	});

	it.each(FIELDS)('labels the %s field', (name) => {
		const control = controlNamed(inquiryFormIn(html), name);
		const id = /\bid="([^"]+)"/.exec(control)?.[1];

		expect(id).toBeDefined();
		expect(html).toMatch(new RegExp(`<label[^>]*\\bfor="${id}"`));
	});

	// Turnstile needs JavaScript to produce a token, so the form can no longer
	// be sent without it (issue #10 overrides #9 here). It is still a plain
	// form post: the one script on the page is Turnstile's, which only adds a
	// field, and nothing intercepts the submission.
	it('renders a Turnstile widget with a site key inside the form', () => {
		const form = inquiryFormIn(html).html;

		expect(form).toMatch(/<div\b[^>]*\bclass="cf-turnstile"[^>]*\bdata-sitekey="[^"]+"/);
	});

	it('loads Turnstile, and no other script', () => {
		const scripts = [...mainOf(html).matchAll(/<script\b[^>]*>/gi)].map((tag) => /\bsrc="([^"]*)"/.exec(tag[0])?.[1]);

		expect(scripts).toEqual(['https://challenges.cloudflare.com/turnstile/v0/api.js']);
	});

	it('submits as a plain form post, with no script handling it', () => {
		expect(inquiryFormIn(html).html).not.toMatch(/\bon[a-z]+=/i);
	});

	it('tells a visitor without JavaScript why the form will not send', () => {
		expect(inquiryFormIn(html).html).toMatch(/<noscript>[\s\S]*?\S[\s\S]*?<\/noscript>/);
	});

	it('found the built pages to sweep', () => {
		expect(Object.keys(builtPages)).toContain('/dist/client/hire/index.html');
	});

	// "Gone and not replaced": no Typeform, and no other third-party form
	// standing in for it.
	it.each(Object.keys(builtPages))('%s embeds no Typeform or third-party frame', (page) => {
		expect(builtPages[page]).not.toMatch(/typeform/i);
		expect(builtPages[page]).not.toMatch(/<iframe\b/i);
	});
});
