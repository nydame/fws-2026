# Traffic is measured by a Cloudflare Web Analytics beacon written into the build

The practice needs to know whether the site is working, and the 2016 site answered that question with Heap Analytics (`1732739567`) and Hotjar session recording (`1084213`) on every page. Recording the sessions of nonprofits, unions, and research labs to find out which Projects get read is not a trade this site makes. Cloudflare Web Analytics reports page views, referrers, and Core Web Vitals without a cookie, without local storage, and without anything that could follow a visitor to another site — so there is nothing to consent to, and no banner.

The beacon is a `<script defer>` in `BaseLayout`, rendered by `src/components/WebAnalytics.astro` and configured by `PUBLIC_CF_BEACON_TOKEN` at build. A build given no token renders no beacon, so a local build, a fork, or a preview measures nothing rather than reporting under a token that isn't its own.

## Considered Options

- **Cloudflare's automatic setup**, which injects the beacon at the edge for a proxied zone and needs no code at all. Rejected because it is dashboard state: nothing in the repo would say the site is measured, nothing would fail if it were switched off, and the test suite could not see it. The token in the build is reviewable and swept by `test/privacy.test.ts` alongside everything that must not reappear.
- **Carrying Heap and Hotjar forward** — the migration's stated liability, and the reason this ticket exists.
- **A self-hosted counter** (GoatCounter, Umami, Plausible on a Worker) — comparable privacy, but a service to run and keep patched for a site whose whole point is that it no longer depends on a box somebody has to maintain.
- **Worker request logs alone** — free and truly zero-JS, but Workers Static Assets serves prerendered pages without invoking the Worker, so most page views would never appear in them.
- **No analytics at all** — defensible, and it loses the one signal that tells the practitioner whether the rebuild changed anything.

## Consequences

The token has to be set where the site is built — Workers Builds, or whatever CI deploys it — or the deployed pages carry no beacon and the dashboard stays empty. `.env.example` names it alongside `PUBLIC_TURNSTILE_SITE_KEY`, which is set the same way and has the same failure mode. Creating the site in Cloudflare Web Analytics to get a token is a dashboard step no build can do for itself.

The beacon is a third-party script, from `static.cloudflareinsights.com` — the second the site loads, after Turnstile's widget. `test/privacy.test.ts` allows exactly those two origins and fails on any other, so the next one has to be argued for rather than added.

Measurement stops at page views: there are no events, no funnels, and no way to ask what a visitor did before sending a Client Inquiry. Inquiries themselves are rows in D1 (ADR 0001), which is where conversion is counted.
