import { RequestData } from '../types.d.ts';
import { Router } from './router.ts';

export function onRequest(data: RequestData, router: Router) {
	const url = data.request.url;
	return router.exec(url, async (route) => {
		if (!route.middlewares) {
			return route.onRequest(data);
		}

		return route.middlewares.exec(data).then(() => {
			return route.onRequest(data);
		});
	});
}
