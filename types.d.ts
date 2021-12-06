import { ConnInfo } from './src/denostd.ts';

export type RequestData = {
	readonly request: Request;
	readonly connection?: ConnInfo;
	[keys: string]: any;
};

export type Route = {
	/*
	 * Route order.
	 *
	 * @remarks
	 * The smaller this value, the higher the priority.
	 */
	order: number;

	/**
	 * Match URL pattern.
	 */
	pattern: URLPattern;

	/**
	 * Exec before onRequext.
	 */
	middlewares?: Middlewares;

	/**
	 * Return server Response.
	 *
	 * @remarks
	 * Exec next route when return Promise.reject or throw Error.
	 *
	 * @param data Request data etc ...
	 */
	onRequest(data: RequestData): Promise<Response>;
};

export type Middleware = {
	/**
	 * Exec before onRequext.
	 *
	 * @remarks
	 * `data` is used in later middleware and onRequest.
	 * You can add any data to `data`.
	 * Cannot exec onRequest when return Promise.reject or throw Error.
	 *
	 * @param data Request data etc ...
	 */
	onRequestBefore(data: RequestData): Promise<unknown>;
};

export type Middlewares = {
	add(...middlewares: Middleware[]): Middlewares;
	exec(data: RequestData): Promise<unknown>;
};
