import { expect } from 'vitest';

// Reading a rendered page, and the standing rules for its prose (CONTEXT.md,
// the parent spec). Prose assertions are churn, so the rules check
// constraints a future edit could quietly break — never the sentences.

/** The page's `<main>` markup. */
export function mainOf(html: string): string {
	const matched = /<main[^>]*>([\s\S]*?)<\/main>/.exec(html);
	if (!matched) throw new Error('No <main> in the page');
	return matched[1];
}

export function textOf(fragment: string): string {
	return fragment.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}

/**
 * The rendered prose plus the metadata published alongside it: a
 * description reaches og/twitter tags and search listings, so a claim there
 * is just as published as one in `<main>`.
 */
export function publishedText(html: string): string {
	const meta = [...html.matchAll(/<meta[^>]+content="([^"]*)"/gi)].map((m) => m[1]).join(' ');
	return `${textOf(mainOf(html))} ${meta}`;
}

export function h1Count(html: string): number {
	return (html.match(/<h1[\s>]/gi) ?? []).length;
}

/** The text of the page's first `<h1>`. */
export function h1TextOf(html: string): string {
	const matched = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html);
	if (!matched) throw new Error('No <h1> in the page');
	return textOf(matched[1]).trim();
}

/**
 * Firefly Web Services is a shingle over a solo practice, so the practice is
 * never "we" (CONTEXT.md). Scoped to constructions that speak for the
 * practice: "we" describing a Client engagement is ordinary English.
 */
export function expectFirstPersonSingular(text: string): void {
	expect(text).toMatch(/\bI\b/);
	expect(text).not.toMatch(/\bwe(?:'re| are)\s+(?:a|an|the)\b/i);
	expect(text).not.toMatch(/\bwe\s+(?:build|make|design|offer|provide|deliver|specialize)\b/i);
	expect(text).not.toMatch(/\bour\s+(?:team|clients?|work|services?|process|rates?|practice)\b/i);
	expect(text).not.toMatch(/\b(?:contact|hire|email|about)\s+us\b/i);
}

/**
 * The 2016 site published $75/hour. A rate on a page is a promise that ages
 * badly and prices the work before the conversation.
 */
export function expectNoRate(text: string): void {
	expect(text).not.toMatch(/\$\s*\d/);
	expect(text).not.toMatch(/\b\d+\s*(?:\/|per\s+|an?\s+)(?:hour|hr|day)\b/i);
}
