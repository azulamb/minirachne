import { Middleware, Middlewares as m, RequestData } from '../types.d.ts';

export class Middlewares implements m {
	public static create(...middlewares: Middleware[]): Middlewares
	{
		return new Middlewares().add(...middlewares);
	}

	private middlewares: Middleware[] = [];

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
