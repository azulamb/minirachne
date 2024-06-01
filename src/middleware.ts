import { Middleware, MiddlewareManager as m, RequestData } from '../types.d.ts';

/** Middleware manager. */
export class MiddlewareManager implements m {
  /**
   * Create MiddlewareManager.
   * MiddlewareManager.create(middleware1, middleware2, ...);
   */
  public static create(...middleware: Middleware[]): MiddlewareManager {
    return new MiddlewareManager().add(...middleware);
  }

  protected middleware: Middleware[] = [];

  /** Add middleware. */
  public add(...middleware: Middleware[]) {
    this.middleware.push(...middleware);
    return this;
  }

  public async exec(data: RequestData) {
    for (const middleware of this.middleware) {
      await middleware.handle(data);
    }
  }
}
