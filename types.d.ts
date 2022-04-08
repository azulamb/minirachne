import { ConnInfo } from './src/denostd.ts';

export type RequestData = {
	readonly request: Request;
	readonly connection?: ConnInfo;
	// deno-lint-ignore no-explicit-any
	detail: { [keys: string]: any };
};

export interface OnRequestHandler {
	(this: Route, data: RequestData): Promise<Response>;
}

export interface RouteLike {
	/*
	 * Route order.
	 *
	 * The smaller this value, the higher the priority.
	 */
	order?: number;

	/**
	 * Match URL pattern.
	 */
	pattern?: URLPattern;

	/**
	 * Exec before onRequext.
	 */
	middlewares?: Middlewares;

	/**
	 * Return server Response.
	 *
	 * Exec next route when return Promise.reject or throw Error.
	 * This object is Route when called this method.
	 * You can use order and pattern.
	 *
	 * @param data Request data etc ...
	 */
	onRequest(this: Route, data: RequestData): Promise<Response>;
}

export interface Route extends RouteLike {
	/*
	 * Route order.
	 *
	 * The smaller this value, the higher the priority.
	 */
	order: number;

	/**
	 * Match URL pattern.
	 */
	pattern: URLPattern;
}

export type Middleware = {
	/**
	 * Exec before onRequext.
	 *
	 * `data` is used in later middleware and onRequest.
	 * You can add any data to `data`.
	 * Cannot exec onRequest when return Promise.reject or throw Error.
	 *
	 * @param data Request data etc ...
	 */
	handle(data: RequestData): Promise<unknown>;
};

export type Middlewares = {
	add(...middlewares: Middleware[]): Middlewares;
	exec(data: RequestData): Promise<unknown>;
};
