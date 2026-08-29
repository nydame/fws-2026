import { env, SELF } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('walking skeleton', () => {
	it('serves / through the built worker', async () => {
		const response = await SELF.fetch('https://example.com/');
		expect(response.status).toBe(200);
	});

	it('reads and writes the local D1 binding', async () => {
		await env.DB.exec(
			'CREATE TABLE IF NOT EXISTS walking_skeleton_probe (id INTEGER PRIMARY KEY, note TEXT)',
		);
		await env.DB.prepare('INSERT INTO walking_skeleton_probe (note) VALUES (?)').bind('binding is real').run();

		const row = await env.DB.prepare('SELECT note FROM walking_skeleton_probe LIMIT 1').first<{
			note: string;
		}>();

		expect(row?.note).toBe('binding is real');
	});
});
