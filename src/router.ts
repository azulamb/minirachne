import { Middlewares, Route, RouteLike } from '../types.d.ts';

function RouteLikeChecker(route: RouteLike, arg = 'arg1') {
	if (typeof route !== 'object') {
		throw new Error(`${arg} is not RouteLike object.`);
	}
	if (typeof route.onRequest !== 'function') {
		throw new Error(`${arg} han no RouteLike.onRequest().`);
	}
	return <Route> route;
}

function RouteChecker(route: Route) {
	RouteLikeChecker(route, 'arg0');

	if (!(route.pattern instanceof URLPattern)) {
		throw new Error('arg0 has no Route.pattern.');
	}

	return route;
}

export class Router {
	private baseurl!: string;
	private routes: Route[] = [];

	constructor(baseurl: string | URL) {
		this.set(baseurl);
	}

	public path(path: string) {
		return new URLPattern(path, this.baseurl);
	}

	public set(baseurl: string | URL) {
		this.baseurl = (typeof (baseurl) === 'string' ? new URL(baseurl) : baseurl).toString();

		return this;
	}

	/**
	 * @param path string path ('/test', '/img/*' etc ...) or URLPattern.
	 * @param route Call onRequest() when route accessed.
	 * @param middlewares Set middlewares in route if exists.
	 */
	public add(path: string | URLPattern, route: RouteLike, middlewares?: Middlewares): this;
	/**
	 * @param route Add route.
	 * @param middlewares Set middlewares in route if exists.
	 */
	public add(route: Route, middlewares?: Middlewares): this;
	add(arg0: string | URLPattern | Route, arg1: RouteLike | Middlewares | undefined, arg2?: Middlewares) {
		if (typeof arg0 === 'string') {
			arg0 = this.path(arg0);
		}
		let route: Route;

		if (arg0 instanceof URLPattern) {
			// RouteLike
			route = RouteLikeChecker(<RouteLike> arg1);

			route.order = this.nextOrder();
			route.pattern = arg0;

			if (arg2) {
				route.middlewares = arg2;
			}
		} else {
			// Route
			route = RouteChecker(arg0);
			if (typeof route.order !== 'number') {
				route.order = this.nextOrder();
			}

			if (arg1) {
				route.middlewares = <Middlewares> arg1;
			}
		}

		this.routes.push(route);
		this.routes.sort((a, b) => {
			return a.order - b.order;
		});

		return this;
	}

	public remove(route: Route) {
		const index = this.routes.indexOf(route);
		if (0 <= index) {
			this.routes.splice(index, 1);
		}

		return this;
	}

	public async exec(
		url: string,
		onMatch: (route: Route) => Promise<Response | null>,
	) {
		for (const route of this.routes) {
			if (!route.pattern.test(url)) continue;

			try {
				const response = await onMatch(route);
				return response;
				// deno-lint-ignore no-unused-vars no-empty
			} catch (error) {
			}
		}

		return null;
	}

	protected nextOrder() {
		return (this.routes[this.routes.length - 1]?.order || 0) + 1;
	}
}
