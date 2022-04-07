import * as asserts from '../_setup.ts';
import { Middleware, RequestData } from '../../types.d.ts';
import { Middlewares } from '../../src/middleware.ts';

class MiddlewareSample implements Middleware {
	private sample: RequestData;
	public called = false;

	constructor(data: RequestData) {
		this.sample = data;
	}

	handle(data: RequestData): Promise<unknown> {
		asserts.assertEquals(data, this.sample);

		this.called = true;

		return Promise.resolve();
	}
}

class ErrorMiddleware implements Middleware {
	// deno-lint-ignore no-unused-vars
	handle(data: RequestData): Promise<unknown> {
		throw new Error('OK');
	}
}

Deno.test('Middrewares manage', async () => {
	const data: RequestData = {
		request: new Request('http://localhost:8080/'),
		detail: {},
	};
	const list: MiddlewareSample[] = [];
	for (let i = 0; i < 5; ++i) {
		list.push(new MiddlewareSample(data));
	}

	const middlewares = Middlewares.create(list[0], list[1]);
	middlewares.add(list[2], list[3]);

	await middlewares.exec(data);

	for (let i = 0; i < 4; ++i) {
		asserts.assertEquals(list[i].called, true);
	}
	asserts.assertEquals(list[4].called, false);
});

Deno.test('Middreware failure', async () => {
	const data: RequestData = {
		request: new Request('http://localhost:8080/'),
		detail: {},
	};
	const middleware = new ErrorMiddleware();

	const middlewares = Middlewares.create(middleware);

	asserts.assertRejects(() => {
		return middlewares.exec(data);
	});
});
