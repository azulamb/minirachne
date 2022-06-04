import { Middleware, Middlewares as m, RequestData } from '../types.d.ts';

/** Middleware manager. */
export class Middlewares implements m {
	/**
	 * Create Middlewares.
	 * Middlewares.create(middleware1, middleware2, ...);
	 */
	public static create(...middlewares: Middleware[]): Middlewares {
		return new Middlewares().add(...middlewares);
	}

	protected middlewares: Middleware[] = [];

	/** Add middleware. */
	public add(...middlewares: Middleware[]) {
		this.middlewares.push(...middlewares);
		return this;
	}

	public async exec(data: RequestData) {
		for (const middleware of this.middlewares) {
			await middleware.handle(data);
		}
	}
}
