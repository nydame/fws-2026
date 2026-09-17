// The Project content set, read from the source Markdown at transform time.
//
// Tests assert the *rules* the site is built on — drafts get no page, Earlier
// Work gets no page, listings follow `order` — against whatever Projects
// happen to exist, so editing content never breaks the suite. Naming live
// Projects in assertions is what made the previous versions of these tests
// fail the moment the placeholder content was replaced.
//
// `import.meta.glob` is resolved by Vite outside the workerd sandbox the test
// bodies run in (see all-routes.test.ts), which is what makes the source
// Markdown reachable from a test that otherwise only has `SELF.fetch()`.
const sources = import.meta.glob('/src/content/projects/*.md', {
	eager: true,
	query: '?raw',
	import: 'default',
}) as Record<string, string>;

export interface Project {
	/** Matches Astro's collection `id`, and so the `/work/<slug>/` URL. */
	slug: string;
	title: string;
	/** Absent means the Client is unnamed — see CONTEXT.md. */
	client?: string;
	summary: string;
	startDate: string;
	era: 'current' | 'earlier';
	/** Selects the Project onto the home page's shop window. */
	featured: boolean;
	order: number;
	draft: boolean;
}

const FRONTMATTER = /^---\r?\n([\s\S]*?)\r?\n---/;
const LIST_ITEM = /^\s+-\s+(.*)$/;
const FIELD = /^([a-zA-Z]+):\s*(.*)$/;

function unquote(value: string): string {
	const trimmed = value.trim();
	const quoted = /^"(.*)"$/.exec(trimmed) ?? /^'(.*)'$/.exec(trimmed);
	return quoted ? quoted[1] : trimmed;
}

// Deliberately minimal: the frontmatter shape is fixed by the Zod schema in
// src/content.config.ts — flat scalars plus one list — so this handles exactly
// that and throws on anything it does not recognise rather than guessing.
function parseFrontmatter(raw: string, path: string): Record<string, string | string[]> {
	const matched = FRONTMATTER.exec(raw);
	if (!matched) throw new Error(`No frontmatter block in ${path}`);

	const fields: Record<string, string | string[]> = {};
	let lastKey: string | null = null;

	for (const line of matched[1].split(/\r?\n/)) {
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

function requireString(fields: Record<string, string | string[]>, key: string, path: string): string {
	const value = fields[key];
	if (typeof value !== 'string' || value === '') throw new Error(`Missing ${key} in ${path}`);
	return value;
}

function toProject(path: string, raw: string): Project {
	const fields = parseFrontmatter(raw, path);
	const era = requireString(fields, 'era', path);
	if (era !== 'current' && era !== 'earlier') throw new Error(`Unknown era "${era}" in ${path}`);

	const client = fields.client;
	return {
		slug: path.replace(/^.*\//, '').replace(/\.md$/, ''),
		title: requireString(fields, 'title', path),
		client: typeof client === 'string' && client !== '' ? client : undefined,
		summary: requireString(fields, 'summary', path),
		startDate: requireString(fields, 'startDate', path),
		era,
		// `featured` and `draft` both default to false in the Zod schema, so an
		// absent key is a legitimate `false` rather than a malformed file.
		featured: fields.featured === 'true',
		order: Number(requireString(fields, 'order', path)),
		draft: fields.draft === 'true',
	};
}

const byOrder = (a: Project, b: Project) => a.order - b.order;

export const allProjects: Project[] = Object.entries(sources)
	.map(([path, raw]) => toProject(path, raw))
	.sort(byOrder);

/** Gets a `/work/<slug>/` page. */
export const publishedCurrent = allProjects.filter((p) => p.era === 'current' && !p.draft);
/** Listed on `/work/` as a dated row only. */
export const publishedEarlier = allProjects.filter((p) => p.era === 'earlier' && !p.draft);
/** Every Project the build renders somewhere on /work/. */
export const publishedProjects = allProjects.filter((p) => !p.draft);
/**
 * The home page's shop window, in the order the home page renders it.
 *
 * Mirrors index.astro's own filter, `era` included: featuring an Earlier
 * Work Project would otherwise make the suite demand a `/work/<slug>/` link
 * for a Project that deliberately has no page.
 */
export const featuredProjects = publishedCurrent.filter((p) => p.featured);
/** Published Current Work the home page deliberately leaves off. */
export const unfeaturedCurrent = publishedCurrent.filter((p) => !p.featured);
/** Must not appear anywhere in the build. */
export const draftProjects = allProjects.filter((p) => p.draft);
/** No Earlier Work Project gets a page, draft or not. */
export const earlierProjects = allProjects.filter((p) => p.era === 'earlier');

export function urlFor(project: Project): string {
	return `/work/${project.slug}/`;
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
