import { HTTPError, HTTPErrors } from './http_error.ts';
import type { Middleware, OnRequestHandler, RequestData, Route, RouteLike } from '../types.d.ts';
import { onRequest } from './on_request.ts';
import { MiddlewareManager } from './middleware.ts';

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

class NextRouter implements Route {
  router: Router;
  order!: number;
  pattern!: URLPattern;
  middleware?: MiddlewareManager;

  constructor(base: string, router: Router, middleware?: MiddlewareManager | Middleware | Middleware[]) {
    this.router = router;
    this.pattern = new URLPattern({ pathname: base + '/*' });
    if (!middleware) {
      return;
    }
    if (middleware instanceof MiddlewareManager) {
      this.middleware = middleware;
    } else {
      this.middleware = new MiddlewareManager();
      if (Array.isArray(middleware)) {
        this.middleware.add(...middleware);
      } else {
        this.middleware.add(middleware);
      }
    }
  }

  onRequest(data: RequestData): Promise<Response> {
    return onRequest(data, this.router);
  }
}

class BaseRouter {
  protected parent?: BaseRouter;
  protected base = '';
  protected routes: Route[] = [];

  public path(pathname: string): URLPattern {
    return new URLPattern({ pathname: pathname });
  }

  /**
   * @param path String path ('/test', '/img/*' etc ...).
   * @param route Call onRequest() when route accessed.
   * @param middleware Set MiddlewareManager in route if exists.
   */
  public add(path: string, route: RouteLike, middleware?: MiddlewareManager | Middleware | Middleware[]): this;
  /**
   * @param path String path ('/test', '/img/*' etc ...).
   * @param handler Call when route accessed.
   * @param middleware Set MiddlewareManager in route if exists.
   */
  public add(path: string, handler: OnRequestHandler, middleware?: MiddlewareManager | Middleware | Middleware[]): this;
  /**
   * @param route Add route.
   * @param middleware Set MiddlewareManager in route if exists.
   */
  public add(route: Route, middleware?: MiddlewareManager | Middleware | Middleware[]): this;
  add(
    arg0: string | Route,
    arg1: RouteLike | (MiddlewareManager | Middleware | Middleware[]) | OnRequestHandler | undefined,
    arg2?: MiddlewareManager | Middleware | Middleware[],
  ): this {
    let route: Route;

    if (typeof arg0 === 'string') {
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
      route.pattern = this.path(arg0);

      if (arg2) {
        if (arg2 instanceof MiddlewareManager) {
          route.middleware = arg2;
        } else {
          route.middleware = new MiddlewareManager();
          if (Array.isArray(arg2)) {
            route.middleware.add(...arg2);
          } else {
            route.middleware.add(arg2);
          }
        }
      }
    } else {
      // Route
      route = RouteChecker(arg0);
      if (typeof route.order !== 'number') {
        route.order = this.nextOrder();
      }

      if (arg1) {
        route.middleware = <MiddlewareManager> arg1;
      }
    }

    if (this.parent) {
      route.pattern = this.newPattern(route.pattern);
    }

    this.routes.push(route);
    this.routes.sort((a, b) => {
      return a.order - b.order;
    });

    return this;
  }

  protected nextOrder(): number {
    return (this.routes[this.routes.length - 1]?.order || 0) + 1;
  }

  protected getBase(): string {
    if (!this.parent) {
      return this.base;
    }
    return this.parent.getBase() + this.base;
  }

  protected newPattern(pattern: URLPattern): URLPattern {
    return new URLPattern(Object.assign(
      {},
      pattern,
      { pathname: this.getBase() + pattern.pathname },
    ));
  }

  public addRouter(base: string, router: Router, middleware?: MiddlewareManager | Middleware | Middleware[]): this {
    if (this === <BaseRouter> router) {
      return this;
    }

    router.parent = this;
    this.base = base.replace(/\/$/, '').replace(/^([^\/].*)$/, '/$1');

    for (const route of router.routes) {
      route.pattern = this.newPattern(route.pattern);
      if (route instanceof NextRouter) {
        route.router.updatePattern(this);
      }
    }

    return this.add(new NextRouter(base, router, middleware));
  }

  protected updatePattern(parent: BaseRouter): this {
    for (const route of this.routes) {
      route.pattern = new URLPattern(Object.assign(
        {},
        route.pattern,
        { pathname: parent.getBase() + route.pattern.pathname },
      ));
    }

    return this;
  }

  public remove(route: Route): this {
    const index = this.routes.indexOf(route);
    if (0 <= index) {
      this.routes.splice(index, 1);
    }

    return this;
  }

  public async exec(
    url: string,
    onMatch: (route: Route) => Promise<Response>,
  ): Promise<Response> {
    let lastError: Error | null = null;
    for (const route of this.routes) {
      if (!route.pattern.test(url)) {
        continue;
      }

      try {
        return await onMatch(route);
      } catch (error) {
        lastError = error;
        if (error instanceof HTTPError && !error.getPropagation()) {
          return error.createResponse();
        }
      }
    }
    throw lastError || new Error('UNKNOWN ERROR!!');
  }
}

/**
 * Minirachne router.
 */
export class Router extends BaseRouter {
  /**
   * Only Request.method or X-HTTP-Method-Override = GET
   * @param path String path ('/test', '/img/*' etc ...).
   * @param handler Call when route accessed.
   * @param middleware Set MiddlewareManager in route if exists.
   */
  public get(path: string, handler: OnRequestHandler, middleware?: MiddlewareManager | Middleware | Middleware[]): this {
    return this.add(path, new MethodRoute('GET', handler), middleware);
  }

  /**
   * Only Request.method or X-HTTP-Method-Override = HEAD
   * @param path String path ('/test', '/img/*' etc ...).
   * @param handler Call when route accessed.
   * @param middleware Set MiddlewareManager in route if exists.
   */
  public head(path: string, handler: OnRequestHandler, middleware?: MiddlewareManager | Middleware | Middleware[]): this {
    return this.add(path, new MethodRoute('HEAD', handler), middleware);
  }

  /**
   * Only Request.method or X-HTTP-Method-Override = POST
   * @param path String path ('/test', '/img/*' etc ...).
   * @param handler Call when route accessed.
   * @param middleware Set MiddlewareManager in route if exists.
   */
  public post(path: string, handler: OnRequestHandler, middleware?: MiddlewareManager | Middleware | Middleware[]): this {
    return this.add(path, new MethodRoute('POST', handler), middleware);
  }

  /**
   * Only Request.method or X-HTTP-Method-Override = PUT
   * @param path String path ('/test', '/img/*' etc ...).
   * @param handler Call when route accessed.
   * @param middleware Set MiddlewareManager in route if exists.
   */
  public put(path: string, handler: OnRequestHandler, middleware?: MiddlewareManager | Middleware | Middleware[]): this {
    return this.add(path, new MethodRoute('PUT', handler), middleware);
  }

  /**
   * Only Request.method or X-HTTP-Method-Override = DELETE
   * @param path String path ('/test', '/img/*' etc ...).
   * @param handler Call when route accessed.
   * @param middleware Set middleware in route if exists.
   */
  public delete(path: string, handler: OnRequestHandler, middleware?: MiddlewareManager | Middleware | Middleware[]): this {
    return this.add(path, new MethodRoute('DELETE', handler), middleware);
  }

  /*public connect(path: string, handler: OnRequestHandler, middleware?: MiddlewareManager|Middleware|Middleware[]) {
		return this.add(path, new MethodRoute('CONNECT', handler), middleware);
	}*/

  /**
   * Only Request.method or X-HTTP-Method-Override = OPTIONS
   * @param path String path ('/test', '/img/*' etc ...).
   * @param handler Call when route accessed.
   * @param middleware Set MiddlewareManager in route if exists.
   */
  public options(path: string, handler: OnRequestHandler, middleware?: MiddlewareManager | Middleware | Middleware[]): this {
    return this.add(path, new MethodRoute('OPTIONS', handler), middleware);
  }

  /*public trace(path: string, handler: OnRequestHandler, middleware?: MiddlewareManager|Middleware|Middleware[]) {
		return this.add(path, new MethodRoute('TRACE', handler), middleware);
	}*/

  /**
   * Only Request.method or X-HTTP-Method-Override = PATCH
   * @param path String path ('/test', '/img/*' etc ...).
   * @param handler Call when route accessed.
   * @param middleware Set MiddlewareManager in route if exists.
   */
  public patch(path: string, handler: OnRequestHandler, middleware?: MiddlewareManager | Middleware | Middleware[]): this {
    return this.add(path, new MethodRoute('PATCH', handler), middleware);
  }
}
