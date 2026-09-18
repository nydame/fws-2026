// @ts-check
import { basename } from 'node:path';
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare(),
	// The test suite also builds the site against each fixture set in
	// test/fixtures/ (see vitest.config.ts), so every content directory gets its
	// own content-layer cache and no build can inherit another's Posts.
	cacheDir: process.env.BLOG_CONTENT_DIR
		? `./node_modules/.astro-${basename(process.env.BLOG_CONTENT_DIR)}`
		: './node_modules/.astro',
	// Prerendered by default; only the Client Inquiry endpoint (not yet built)
	// will opt out per-route with `export const prerender = false`.
	output: 'static',
	// Canonical + Open Graph/Twitter metadata need an absolute origin.
	site: 'https://go-firefly.com',
});
