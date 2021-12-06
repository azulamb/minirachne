import { Middlewares, Route } from '../types.d.ts';

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

	public add(route: Route, middlewares?: Middlewares) {
		if (middlewares) {
			route.middlewares = middlewares;
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
			} catch (error) {
			}
		}

		return null;
	}
}
