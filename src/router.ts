import { Middlewares, Route, RouteLike } from '../types.d.ts';

function RouteLikeChecker(route: RouteLike): boolean {
	if (typeof route !== 'object') {
		return false;
	}
	if (typeof route.onRequest !== 'function') {
		return false;
	}
	return true;
}

function RouteChecker(route: Route): boolean {
	if (!RouteLikeChecker(route)) {
		return false;
	}
	if (!(route.pattern instanceof URLPattern)) {
		return false;
	}
	return true;
}

export class Router {
	private baseurl!: string;
	private routes: Route[] = [];

	constructor(baseurl: string) {
		this.set(baseurl);
	}

	public path(path: string) {
		return new URLPattern(this.baseurl + path);
	}

	public set(baseurl: string) {
		this.baseurl = baseurl;

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
			route = <Route> arg1;
			if (!RouteLikeChecker(route)) {
				throw new Error('arg1 is not RouteLike.');
			}
			route.order = this.nextOrder();
			route.pattern = arg0;
			if (arg2) {
				route.middlewares = arg2;
			}
		} else {
			// Route
			route = arg0;
			if (!RouteChecker(route)) {
				throw new Error('arg0 is not Route.');
			}
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
