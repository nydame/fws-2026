import { describe, expect, it } from 'vitest';
import { compareByOrder } from '../src/lib/project-order';

function project(order: number) {
	return { id: `project-${order}`, data: { order } } as Parameters<typeof compareByOrder>[0];
}

describe('compareByOrder', () => {
	it('sorts ascending by the frontmatter order key, regardless of input order', () => {
		const items = [project(5), project(1), project(2)];

		items.sort(compareByOrder);

		expect(items.map((item) => item.data.order)).toEqual([1, 2, 5]);
	});
});
