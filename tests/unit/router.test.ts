import * as asserts from '../_setup.ts';
import { Router } from '../../src/router.ts';
import { RequestData, Route } from '../../types.d.ts';
import { HTTPError } from '../../src/httperror.ts';

class SampleRoute implements Route {
	order!: number;
	pattern!: URLPattern;
	public response: Response;

	constructor(response: Response) {
		this.response = response;
	}

	// deno-lint-ignore no-unused-vars
	onRequest(data: RequestData): Promise<Response> {
		return Promise.resolve(this.response);
	}
}

Deno.test('URL', () => {
	const router = new Router();
	asserts.assertEquals(router.path('/sample/index.html'), new URLPattern({ pathname: `/sample/index.html` }));
});

Deno.test('Route', () => {
	const url = 'https://localhost:8080/';
	const router = new Router();
	const list: { route: string; path: string; result?: boolean }[] = [
		{ route: '/sample/index.html', path: '/sample/index.html' },
		{ route: '/sample/*', path: '/sample/index.html' },
		{ route: '/sample/*', path: '/sample/dir/index.html' },
		{ route: '/sample/*', path: '/sample2/index.html', result: false },
	];

	for (const item of list) {
		asserts.assertEquals(
			router.path(item.route).test(new URL(item.path, url)),
			item.result !== false,
			`${item.route} test ${item.path} is ${item.result !== false}`,
		);
	}
});

Deno.test('Add Route', async () => {
	const url = 'https://localhost:8080/';
	const router = new Router();

	asserts.assertThrows(
		() => {
			// deno-lint-ignore no-explicit-any
			router.add(<any> true);
		},
		Error,
		'arg0 is not RouteLike object.',
	);

	asserts.assertThrows(
		() => {
			// deno-lint-ignore no-explicit-any
			router.add(<any> {});
		},
		Error,
		'arg0 han no RouteLike.onRequest().',
	);

	asserts.assertThrows(
		() => {
			const errorRoute = new SampleRoute(new Response());
			router.add(errorRoute);
		},
		Error,
		'arg0 has no Route.pattern.',
	);

	const route0 = new SampleRoute(new Response());
	route0.pattern = router.path('/sample/*');
	router.add(route0);

	const route1 = new SampleRoute(new Response());
	route1.pattern = router.path('/sample2/*');
	router.add(route1);

	const list: { path: string; target?: SampleRoute }[] = [
		{ path: '/sample/index.html', target: route0 },
		{ path: '/sample2/index.html', target: route1 },
		{ path: '/index.html' },
	];

	for (const item of list) {
		const requestURL = new URL(item.path, url).toString();
		if (item.target) {
			asserts.assertEquals(
				await router.exec(requestURL, (route) => {
					return route.onRequest({ request: new Request(requestURL), detail: {} });
				}),
				item.target.response,
			);
		} else {
			asserts.assertRejects(
				() => {
					return router.exec(requestURL, (route) => {
						return route.onRequest({ request: new Request(requestURL), detail: {} });
					});
				},
			);
		}
	}

	router.remove(<Route> list[0].target);
	const requestURL = new URL(list[0].path, url).toString();
	asserts.assertRejects(
		() => {
			return router.exec(requestURL, (route) => {
				return route.onRequest({ request: new Request(requestURL), detail: {} });
			});
		},
	);
});

Deno.test('Method route', async () => {
	const url = 'https://localhost:8080/';
	const router = new Router();

	const methods = ['get', 'head', 'post', 'put', 'delete', /*'connect',*/ 'options', /*'trace',*/ 'patch'];
	const handler = () => {
		return Promise.resolve(new Response('ok'));
	};

	for (const method of methods) {
		router[<'get'> method](`/method/${method}/*`, handler);
	}

	// Success
	for (const method of methods) {
		const requestURL = new URL(`/method/${method}/test`, url).toString();
		const METHOD = method.replace(/[a-z]/g, (c) => {
			return String.fromCharCode(c.charCodeAt(0) & ~32);
		});
		const status = await router.exec(requestURL, (route) => {
			return route.onRequest({ request: new Request(requestURL, { method: METHOD }), detail: {} });
		}).then((response) => {
			return response.status;
		}).catch(() => {
			return 0;
		});
		asserts.assertEquals(status, 200);
	}

	// Unsupported method
	asserts.assertThrows(() => {
		new Request(url.toString(), { method: 'CONNECT' });
	});
	asserts.assertThrows(() => {
		new Request(url.toString(), { method: 'TRACE' });
	});

	// Failure
	for (const path of methods) {
		const requestURL = new URL(`/method/${path}/test`, url).toString();
		for (const method of methods) {
			if (method === path) {
				continue;
			}
			const METHOD = method.replace(/[a-z]/g, (c) => {
				return String.fromCharCode(c.charCodeAt(0) & ~32);
			});
			asserts.assertRejects(
				() => {
					return router.exec(requestURL, (route) => {
						return route.onRequest({ request: new Request(requestURL, { method: METHOD }), detail: {} });
					});
				},
				HTTPError,
				'Method Not Allowed',
			);
		}
	}
});

Deno.test('Method route(Override)', async () => {
	const url = 'https://localhost:8080/';
	const router = new Router();

	router.put(`/method/put/*`, () => {
		return Promise.resolve(new Response('ok'));
	});

	const requestURL = new URL(`/method/put/`, url).toString();
	const status = await router.exec(requestURL, (route) => {
		return route.onRequest({
			request: new Request(requestURL, { method: 'POST', headers: { 'X-HTTP-Method-Override': 'PUT' } }),
			detail: {},
		});
	}).then((response) => {
		return response.status;
	}).catch(() => {
		return 0;
	});
	asserts.assertEquals(status, 200);
});
