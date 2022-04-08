import * as asserts from '../_setup.ts';
import { Router } from '../../src/router.ts';
import { RequestData, Route } from '../../types.d.ts';

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
		asserts.assertEquals(
			await router.exec(requestURL, (route) => {
				return route.onRequest({ request: new Request(requestURL), detail: {} });
			}),
			item.target ? item.target.response : null,
		);
	}

	router.remove(<Route> list[0].target);
	const requestURL = new URL(list[0].path, url).toString();
	asserts.assertNotEquals(
		await router.exec(requestURL, (route) => {
			return route.onRequest({ request: new Request(requestURL), detail: {} });
		}),
		(<SampleRoute> list[0].target).response,
	);
});
