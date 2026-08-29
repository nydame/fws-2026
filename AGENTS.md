# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
pnpm dev       # Start dev server at localhost:4321
pnpm build     # Build production site to ./dist/
pnpm preview   # Preview production build locally
pnpm test      # Build, then run the Vitest suite inside workerd
```

`pnpm test` builds first because the suite runs against the built artifact — the same worker and static assets `wrangler deploy` would ship — not the source config. Tests run inside real `workerd` via `@cloudflare/vitest-pool-workers`, with a real local D1 binding, so there is one seam: `SELF.fetch()` against the built worker. See `test/walking-skeleton.test.ts` and `vitest.config.ts`.

When starting the dev server for longer sessions, use background mode:

```bash
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Knowledge Graph

This repo has a graphify knowledge graph at `graphify-out/graph.json`. Before answering questions about architecture, file relationships, or how something connects, query the graph instead of re-reading files:

```bash
graphify query "<question>"        # BFS traversal, broad context
graphify path "<nodeA>" "<nodeB>"  # shortest path between two concepts
graphify explain "<node>"          # plain-language explanation of one node
```

`graphify-out/` is gitignored, so the graph is local-only and will be absent in a fresh clone — build it with `/graphify .` if `graph.json` is missing.

The graph is updated manually; no git hook is installed. Run `/graphify --update` after changing files, which re-extracts only what changed. Note that code and docs are extracted by different paths: code files go through deterministic AST extraction, while `.md` files and images require an LLM pass. Most of this graph's content comes from the docs, so an update after editing prose is not optional.

`CLAUDE.md` is a symlink to this file. Extracting both produced a duplicate node for every concept, linked in pairs by `semantically_similar_to` edges, so `/CLAUDE.md` is excluded in `.graphifyignore` and only `AGENTS.md` is extracted. If you see such duplicate pairs, the graph predates that exclusion — rebuild it.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Agent skills

### Issue tracker

Issues live as GitHub issues in `nydame/fws-2026`, managed with the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` and `docs/adr/` at the repo root, both created lazily. See `docs/agents/domain.md`.
