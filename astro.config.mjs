// @ts-check
import { basename } from 'node:path';
import cloudflare from '@astrojs/cloudflare';
import { defineConfig, fontProviders } from 'astro/config';

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
	// One typeface, fetched from Fontsource at build and served from this
	// site's own origin: no request to a font host ever leaves a visitor's
	// browser. It replaces the 2016 site's Google Fonts, Typekit kit, and
	// self-hosted Ubuntu set (issue #12). Atkinson Hyperlegible Next is the
	// Braille Institute's legibility-first typeface, which a practice selling
	// accessibility should be able to point to.
	fonts: [
		{
			provider: fontProviders.fontsource(),
			name: 'Atkinson Hyperlegible Next',
			cssVariable: '--font-body',
			weights: [400, 700],
			styles: ['normal', 'italic'],
			fallbacks: ['system-ui', 'sans-serif'],
		},
	],
	// Canonical + Open Graph/Twitter metadata need an absolute origin.
	site: 'https://go-firefly.com',
});
