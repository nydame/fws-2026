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
import { parseFrontmatter, requireString, slugFromPath } from './content-fixtures';

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
	era: 'recent' | 'earlier';
	/** Selects the Project onto the home page's shop window. */
	featured: boolean;
	order: number;
	draft: boolean;
}

function toProject(path: string, raw: string): Project {
	const fields = parseFrontmatter(raw, path);
	const era = requireString(fields, 'era', path);
	if (era !== 'recent' && era !== 'earlier') throw new Error(`Unknown era "${era}" in ${path}`);

	const client = fields.client;
	return {
		slug: slugFromPath(path),
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
export const publishedRecent = allProjects.filter((p) => p.era === 'recent' && !p.draft);
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
export const featuredProjects = publishedRecent.filter((p) => p.featured);
/** Published Recent Work the home page deliberately leaves off. */
export const unfeaturedRecent = publishedRecent.filter((p) => !p.featured);
/** Must not appear anywhere in the build. */
export const draftProjects = allProjects.filter((p) => p.draft);
/** No Earlier Work Project gets a page, draft or not. */
export const earlierProjects = allProjects.filter((p) => p.era === 'earlier');

export function urlFor(project: Project): string {
	return `/work/${project.slug}/`;
}
