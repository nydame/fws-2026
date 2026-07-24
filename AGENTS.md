# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
pnpm dev       # Start dev server at localhost:4321
pnpm build     # Build production site to ./dist/
pnpm preview   # Preview production build locally
```

When starting the dev server for longer sessions, use background mode:

```bash
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Architecture

This is an [Astro](https://astro.build) static site (v7). Astro maps files in `src/pages/` to URL routes automatically — `src/pages/about.astro` becomes `/about`. Static assets go in `public/` and are served at the root path.

TypeScript is configured with Astro's strict preset (`astro/tsconfigs/strict`). No UI framework (React/Vue/Svelte) is integrated yet — when added, components live in `src/components/`. Framework integrations are added via `pnpm astro add <integration>`.

`astro.config.mjs` is currently empty (all defaults). Routing, output mode (static vs. SSR), and integrations are configured there.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
