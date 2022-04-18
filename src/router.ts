import { HTTPErrors } from './httperror.ts';
import { Middlewares, OnRequestHandler, RequestData, Route, RouteLike } from '../types.d.ts';

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

type METHOD = 'GET' | 'HEAD' | 'POST' | 'PUT' | 'DELETE' | /*'CONNECT' |*/ 'OPTIONS' | /*'TRACE' |*/ 'PATCH';

class MethodRoute implements Route {
	order!: number;
	pattern!: URLPattern;
	private handler: OnRequestHandler;
	private method: METHOD;

	constructor(method: METHOD, handler: OnRequestHandler) {
		this.method = method;
		this.handler = handler;
	}

	onRequest(data: RequestData): Promise<Response> {
		const method = data.request.headers.get('X-HTTP-Method-Override') || data.request.method;
		if (method !== this.method) {
			return Promise.reject(HTTPErrors.client.MethodNotAllowed());
		}
		return this.handler.apply(this, [data]);
	}
}

export class Router {
	protected routes: Route[] = [];

	public path(pathname: string) {
		return new URLPattern({ pathname: pathname });
	}

	/**
	 * @param path String path ('/test', '/img/*' etc ...) or URLPattern.
	 * @param route Call onRequest() when route accessed.
	 * @param middlewares Set middlewares in route if exists.
	 */
	public add(path: string | URLPattern, route: RouteLike, middlewares?: Middlewares): this;
	/**
	 * @param path String path ('/test', '/img/*' etc ...) or URLPattern.
	 * @param handler Call when route accessed.
	 * @param middlewares Set middlewares in route if exists.
	 */
	public add(path: string | URLPattern, handler: OnRequestHandler, middlewares?: Middlewares): this;
	/**
	 * @param route Add route.
	 * @param middlewares Set middlewares in route if exists.
	 */
	public add(route: Route, middlewares?: Middlewares): this;
	add(arg0: string | URLPattern | Route, arg1: RouteLike | Middlewares | OnRequestHandler | undefined, arg2?: Middlewares) {
		if (typeof arg0 === 'string') {
			arg0 = this.path(arg0);
		}
		let route: Route;

		if (arg0 instanceof URLPattern) {
			if (typeof arg1 === 'function') {
				route = <Route> {
					onRequest: (data: RequestData) => {
						return (<OnRequestHandler> arg1).apply(<Route> route, [data]);
					},
				};
			} else {
				// RouteLike
				route = RouteLikeChecker(<RouteLike> arg1);
			}

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

	/**
	 * Only Request.method or X-HTTP-Method-Override = GET
	 * @param path String path ('/test', '/img/*' etc ...) or URLPattern.
	 * @param handler Call when route accessed.
	 * @param middlewares Set middlewares in route if exists.
	 */
	public get(path: string | URLPattern, handler: OnRequestHandler, middlewares?: Middlewares) {
		return this.add(path, new MethodRoute('GET', handler), middlewares);
	}

	/**
	 * Only Request.method or X-HTTP-Method-Override = HEAD
	 * @param path String path ('/test', '/img/*' etc ...) or URLPattern.
	 * @param handler Call when route accessed.
	 * @param middlewares Set middlewares in route if exists.
	 */
	public head(path: string | URLPattern, handler: OnRequestHandler, middlewares?: Middlewares) {
		return this.add(path, new MethodRoute('HEAD', handler), middlewares);
	}

	/**
	 * Only Request.method or X-HTTP-Method-Override = POST
	 * @param path String path ('/test', '/img/*' etc ...) or URLPattern.
	 * @param handler Call when route accessed.
	 * @param middlewares Set middlewares in route if exists.
	 */
	public post(path: string | URLPattern, handler: OnRequestHandler, middlewares?: Middlewares) {
		return this.add(path, new MethodRoute('POST', handler), middlewares);
	}

	/**
	 * Only Request.method or X-HTTP-Method-Override = PUT
	 * @param path String path ('/test', '/img/*' etc ...) or URLPattern.
	 * @param handler Call when route accessed.
	 * @param middlewares Set middlewares in route if exists.
	 */
	public put(path: string | URLPattern, handler: OnRequestHandler, middlewares?: Middlewares) {
		return this.add(path, new MethodRoute('PUT', handler), middlewares);
	}

	/**
	 * Only Request.method or X-HTTP-Method-Override = DELETE
	 * @param path String path ('/test', '/img/*' etc ...) or URLPattern.
	 * @param handler Call when route accessed.
	 * @param middlewares Set middlewares in route if exists.
	 */
	public delete(path: string | URLPattern, handler: OnRequestHandler, middlewares?: Middlewares) {
		return this.add(path, new MethodRoute('DELETE', handler), middlewares);
	}

	/*public connect(path: string | URLPattern, handler: OnRequestHandler, middlewares?: Middlewares) {
		return this.add(path, new MethodRoute('CONNECT', handler), middlewares);
	}*/

	/**
	 * Only Request.method or X-HTTP-Method-Override = OPTIONS
	 * @param path String path ('/test', '/img/*' etc ...) or URLPattern.
	 * @param handler Call when route accessed.
	 * @param middlewares Set middlewares in route if exists.
	 */
	public options(path: string | URLPattern, handler: OnRequestHandler, middlewares?: Middlewares) {
		return this.add(path, new MethodRoute('OPTIONS', handler), middlewares);
	}

	/*public trace(path: string | URLPattern, handler: OnRequestHandler, middlewares?: Middlewares) {
		return this.add(path, new MethodRoute('TRACE', handler), middlewares);
	}*/

	/**
	 * Only Request.method or X-HTTP-Method-Override = PATCH
	 * @param path String path ('/test', '/img/*' etc ...) or URLPattern.
	 * @param handler Call when route accessed.
	 * @param middlewares Set middlewares in route if exists.
	 */
	public patch(path: string | URLPattern, handler: OnRequestHandler, middlewares?: Middlewares) {
		return this.add(path, new MethodRoute('PATCH', handler), middlewares);
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
		onMatch: (route: Route) => Promise<Response>,
	) {
		let lastError: Error | null = null;
		for (const route of this.routes) {
			if (!route.pattern.test(url)) continue;

			try {
				const response = await onMatch(route);
				return response;
			} catch (error) {
				lastError = error;
			}
		}
		throw lastError || new Error('UNKNOWN ERROR!!');
	}

	protected nextOrder() {
		return (this.routes[this.routes.length - 1]?.order || 0) + 1;
	}
}
