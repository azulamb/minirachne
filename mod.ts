/** Framework name. */
export const NAME = 'Minirachne';

import { VERSION as MINIRACHNE_VERSION } from './version.ts';

/** Framework version. */
export const VERSION = MINIRACHNE_VERSION;

export * from './types.d.ts';

import { dirname, fromFileUrl, join } from './src/deno_std.ts';

import DENO_JSON from './deno.json' with { type: 'json' };
export const STD_VERSION = DENO_JSON.imports['$minirachne_std/'].replace(/^.+std@([0-9.]+).+$/, '$1');

/** HTTP Server. */
export { Server } from './src/server.ts';

/** Minirachne Middleware manager. */
export { MiddlewareManager } from './src/middleware.ts';

export { Cookie } from './src/deno_std.ts';

/**
 * Create absolute path.
 * Minirachne.createAbsolutePath(import.meta, './docs'); // C:\DIR\minirachne\docs
 * @param path Relative path
 * @returns Absolute path
 */
export function createAbsolutePath(meta: ImportMeta, path = '') {
	return join(dirname(fromFileUrl(meta.url)), path);
}

/** HTTP Redirect. */
export * from './src/redirect.ts';

/** HTTP Error. */
export * from './src/http_error.ts';

/** Static routes. */
export { Router } from './src/router.ts';

/** Static routes. */
export { StaticRoute } from './src/static.ts';

/** WebSocket listener. */
export { WebSocketListener } from './src/ws.ts';

/** Middleware. */
export { BasicAuth } from './src/middleware/basic_auth.ts';

export { ServerResponse as Response } from './src/response.ts';
