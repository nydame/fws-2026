import { afterEach, vi } from 'vitest';

// Every outbound request the worker makes, intercepted at the fetch layer —
// the only place a test can stand in for a third-party API without reaching
// inside the endpoint. The built worker runs in the same isolate as the
// tests, so its `fetch` is this one.
//
// Each API is answered by URL. A request to any URL nothing answers fails:
// nothing unexpected should leave the worker, and no test ever reaches a
// real service.

type Answer = (request: Request) => Promise<Response>;

const answers = new Map<string, Answer>();

afterEach(() => {
	vi.restoreAllMocks();
	answers.clear();
});

/** Answers every request to `url` with `answer`, replacing any earlier answer. */
export function answerOutbound(url: string, answer: Answer): void {
	answers.set(url, answer);

	if (vi.isMockFunction(globalThis.fetch)) return;
	vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
		const request = new Request(input, init);
		const answer = answers.get(request.url);
		if (!answer) throw new Error(`Unexpected outbound request to ${request.url}`);
		return answer(request);
	});
}
