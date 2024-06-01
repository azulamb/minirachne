import { RequestData } from '../types.d.ts';
import { Router } from './router.ts';
import { HTTPError } from './http_error.ts';

export function onRequest(data: RequestData, router: Router) {
  const url = data.request.url;
  return router.exec(url, (route) => {
    if (!route.middleware) {
      return route.onRequest(data);
    }

    return route.middleware.exec(data).then(() => {
      return route.onRequest(data);
    });
  }).catch((error) => {
    if (error instanceof HTTPError && !error.getPropagation()) {
      return error.createResponse();
    }
    throw error;
  });
}
