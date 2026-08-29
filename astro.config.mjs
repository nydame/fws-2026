// @ts-check
import cloudflare from '@astrojs/cloudflare';
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare(),
	// Prerendered by default; only the Client Inquiry endpoint (not yet built)
	// will opt out per-route with `export const prerender = false`.
	output: 'static',
});
