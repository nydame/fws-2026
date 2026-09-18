// Helpers shared by the content-driven fixture modules (project-fixtures.ts,
// blog-fixtures.ts) and the tests that read their output.
//
// Tests assert the *rules* the site is built on against whatever content
// happens to exist, so editing content never breaks the suite. That means
// reading the source Markdown, which is what these helpers do.

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const LIST_ITEM = /^\s+-\s+(.*)$/;
const FIELD = /^([a-zA-Z]+):\s*(.*)$/;

function unquote(value: string): string {
	const trimmed = value.trim();
	const quoted = /^"(.*)"$/.exec(trimmed) ?? /^'(.*)'$/.exec(trimmed);
	return quoted ? quoted[1] : trimmed;
}

function splitFrontmatter(raw: string, path: string): { frontmatter: string; body: string } {
	const matched = FRONTMATTER.exec(raw);
	if (!matched) throw new Error(`No frontmatter block in ${path}`);
	return { frontmatter: matched[1], body: raw.slice(matched[0].length).trim() };
}

// Deliberately minimal: the frontmatter shapes are fixed by the Zod schemas
// in src/content.config.ts — flat scalars plus lists — so this handles exactly
// that and throws on anything it does not recognise rather than guessing.
export function parseFrontmatter(raw: string, path: string): Record<string, string | string[]> {
	const { frontmatter } = splitFrontmatter(raw, path);

	const fields: Record<string, string | string[]> = {};
	let lastKey: string | null = null;

	for (const line of frontmatter.split(/\r?\n/)) {
		if (!line.trim()) continue;

		const item = LIST_ITEM.exec(line);
		if (item) {
			if (!lastKey) throw new Error(`List item before any key in ${path}: ${line}`);
			const existing = fields[lastKey];
			fields[lastKey] = Array.isArray(existing) ? [...existing, unquote(item[1])] : [unquote(item[1])];
			continue;
		}

		const field = FIELD.exec(line);
		if (!field) throw new Error(`Unparsed frontmatter line in ${path}: ${line}`);
		lastKey = field[1];
		fields[lastKey] = unquote(field[2]);
	}

	return fields;
}

/** Everything after the frontmatter block: the Markdown the page renders. */
export function bodyOf(raw: string, path: string): string {
	return splitFrontmatter(raw, path).body;
}

export function requireString(
	fields: Record<string, string | string[]>,
	key: string,
	path: string,
): string {
	const value = fields[key];
	if (typeof value !== 'string' || value === '') throw new Error(`Missing ${key} in ${path}`);
	return value;
}

/** The file name without its directory or `.md`, which is Astro's collection `id`. */
export function slugFromPath(path: string): string {
	return path.replace(/^.*\//, '').replace(/\.md$/, '');
}

/** Matches Astro's HTML escaping, so expected text can be found in the output. */
export function escapeHtml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#39;');
}

/** Narrows an assertion to one `<section aria-labelledby="...">` of a page. */
export function sectionLabelled(html: string, id: string): string {
	const matched = new RegExp(`<section aria-labelledby="${id}"[^>]*>([\\s\\S]*?)</section>`).exec(html);
	if (!matched) throw new Error(`No <section aria-labelledby="${id}"> in the page`);
	return matched[1];
}

/**
 * Every `<nav>` on a page, concatenated — for asserting what the site
 * navigation links to without matching links elsewhere on the page.
 */
export function navMarkup(html: string): string {
	const navs = html.match(/<nav[\s>][\s\S]*?<\/nav>/g);
	if (!navs?.length) throw new Error('No <nav> in the page');
	return navs.join('\n');
}

/** Any link to the blog: /blog, /blog/, or a Post under it. */
export const BLOG_LINK = /href="\/blog(?:[/"#?])/;
