# Client Inquiries are stored in D1 behind a single dynamic route

The site is a portfolio and is otherwise entirely static, but a Client Inquiry has to be stored somewhere the practitioner can read it back in order — not just forwarded as mail. We install the Cloudflare adapter and mark exactly one route `prerender = false`: a POST endpoint that validates a Turnstile token, writes a row to D1, and sends a notification through Resend. Every other route is prerendered.

## Considered Options

- **Netlify Forms** — the least work by a distance, and it stores submissions with spam filtering and no server code at all. Rejected because the site is hosted on Cloudflare by preference, not by accident.
- **Cloudflare Pages Functions in a `functions/` directory** — keeps the Astro build purely static, at the cost of putting the form's handler outside Astro's routing where it is easy to forget.
- **A third-party form service** (Formspree, Basin) — host-agnostic, but reintroduces the dependency the Typeform embed on the 2016 site already demonstrated the cost of.
- **Full on-demand rendering** — a server for a site whose content changes when someone edits Markdown.

## Consequences

The site is no longer purely static, so it cannot be served from plain object storage without reworking the form. Turnstile is not optional: a public POST endpoint that writes to a database will be found by bots. Notification depends on Resend because Workers cannot send outbound mail on their own — Cloudflare Email Routing is inbound only — so an inquiry arriving is one third-party API call away from being noticed.
