export const NAME = 'Minirachne';
export const VERSION = '0.1.0';

export * from './types.d.ts';
import { dirname, fromFileUrl, join } from './src/denostd.ts';
export { Server } from './src/server.ts';
export { Middlewares } from './src/middleware.ts';
export { getCookies, setCookie } from './src/denostd.ts';

export function createAbsolutePath(meta: ImportMeta, path = '') {
	return join(dirname(fromFileUrl(meta.url)), path);
}

// Default routes
export { StaticRoute } from './src/static.ts';
