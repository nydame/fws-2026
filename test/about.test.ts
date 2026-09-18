import { SELF } from 'cloudflare:test';
import { beforeAll, describe, expect, it } from 'vitest';
import { expectFirstPersonSingular, expectNoRate, h1Count, mainOf, publishedText, textOf } from './page-text';

// The About page is mostly prose, and prose assertions are churn (see the
// spec's testing decisions). So nothing here asserts on wording: these are
// the standing constraints from issue #7 that the 2016 page violated and
// that a future edit could quietly reintroduce.
//
// Constraints that a visitor or a search result can see apply to the whole
// document, not just <main> — the description prop reaches og/twitter tags
// and search listings, so a rate or a stack claim there is just as published.
let html: string;
let main: string;

beforeAll(async () => {
	html = await (await SELF.fetch('https://example.com/about/')).text();
	main = mainOf(html);
});

function sentences(text: string): string[] {
	return text.split(/(?<=[.!?])\s+/);
}

describe('/about/', () => {
	it('returns 200 and renders exactly one <h1>', async () => {
		const response = await SELF.fetch('https://example.com/about/');

		expect(response.status).toBe(200);
		expect(h1Count(html)).toBe(1);
	});

	// The 2016 page was three Q&A articles. A question used as a label is the
	// format's signature wherever it is marked up — a heading, a <summary>, or
	// a definition list — so all three are checked rather than headings alone.
	it('is prose rather than a Q&A', () => {
		const labels = [
			...main.matchAll(/<h[2-6][^>]*>([\s\S]*?)<\/h[2-6]>/gi),
			...main.matchAll(/<summary[^>]*>([\s\S]*?)<\/summary>/gi),
		].map((m) => textOf(m[1]).trim());

		expect(labels.filter((label) => label.endsWith('?'))).toEqual([]);
		expect(main).not.toMatch(/<dl[\s>]/i);
		expect(main).not.toMatch(/<details[\s>]/i);
	});

	// Firefly Web Services is a shingle over a solo practice, so the practice
	// is never "we" (CONTEXT.md). Scoped to constructions that speak for the
	// practice: "we" describing a Client engagement is ordinary English and
	// the acceptance criterion does not forbid it.
	it('never speaks for the practice in the first person plural', () => {
		expectFirstPersonSingular(textOf(main));
	});

	// The 2016 page published $75/hour. A rate on a page is a promise that
	// ages badly and prices the work before the conversation.
	it('publishes no rate', () => {
		expectNoRate(publishedText(html));
	});

	// The 2016 page's third answer said the site was built with Pico, which
	// this migration made false. The trap is naming this site's own stack, not
	// naming a technology — "what I build is WordPress" is a skill claim and
	// stays true, so the check is per sentence rather than per page.
	it('makes no claim about the technology this site runs on', () => {
		const SELF_REFERENCE =
			/\b(?:this (?:site|page|website)|the (?:site|page) you(?:'re| are) reading|my own site|firefly'?s own site|go-firefly\.com)\b/i;
		const STACK = /\b(?:Pico|Astro|Cloudflare|WordPress|Netlify|Vercel|Jekyll|Hugo|Eleventy)\b/i;

		const selfReferentialStackClaims = sentences(publishedText(html)).filter(
			(sentence) => SELF_REFERENCE.test(sentence) && STACK.test(sentence),
		);

		expect(selfReferentialStackClaims).toEqual([]);
		// Named outright because it is the claim that actually went stale.
		expect(publishedText(html)).not.toMatch(/\bPico\b/i);
	});

	// A sample of CONTEXT.md's _Avoid_ list: the terms that are wrong wherever
	// they appear, rather than the ones that depend on what they refer to.
	it('avoids the retired terms from CONTEXT.md', () => {
		const text = publishedText(html);

		for (const term of [
			/case stud(?:y|ies)/i,
			/\bFWS\b/,
			/\bthe (?:agency|company|team)\b/i,
			/\bpurpose-driven\b/i,
			/\bsocial good\b/i,
			/\bNGOs?\b/,
		]) {
			expect(text, `retired term ${term} appears`).not.toMatch(term);
		}
	});
});
