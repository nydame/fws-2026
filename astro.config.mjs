// @ts-check
import { basename } from 'node:path';
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	// The adapter's defaults would give the worker two bindings this site never
	// uses: Cloudflare Images for on-demand image transforms, and a KV
	// namespace for sessions — which set cookies, and the site sets none
	// (issue #1). Images are optimised at build instead, since every page that
	// could show one is prerendered.
	adapter: cloudflare({ imageService: 'compile' }),
	session: false,
	// The test suite also builds the site against each fixture set in
	// test/fixtures/ (see vitest.config.ts), so every content directory gets its
	// own content-layer cache and no build can inherit another's Posts.
	cacheDir: process.env.BLOG_CONTENT_DIR
		? `./node_modules/.astro-${basename(process.env.BLOG_CONTENT_DIR)}`
		: './node_modules/.astro',
	// Prerendered by default; only the Client Inquiry endpoint,
	// src/pages/hire/inquiry.astro, opts out with `export const prerender = false`
	// (docs/adr/0001-client-inquiry-pipeline.md).
	output: 'static',
	// Canonical + Open Graph/Twitter metadata need an absolute origin.
	site: 'https://go-firefly.com',
});
