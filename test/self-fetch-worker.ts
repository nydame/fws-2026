// Test-only entrypoint. The real site is fully prerendered right now (no
// route sets `prerender = false`), so `astro build` emits static assets with
// no worker script — there is nothing for `SELF` to bind to. This gives the
// test suite a worker, wired to the same ASSETS binding a real deploy uses,
// so `SELF.fetch()` proves the built artifact is reachable through workerd.
// Once a real dynamic route exists, `SELF` should bind to Astro's own
// generated worker instead and this file can go.
export default {
	fetch: (request: Request, env: { ASSETS: Fetcher }) => env.ASSETS.fetch(request),
} satisfies ExportedHandler<{ ASSETS: Fetcher }>;
