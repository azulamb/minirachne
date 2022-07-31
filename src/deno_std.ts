/** Use Deno.std version. */
export const VERSION = '0.150.0';
export * from 'https://deno.land/std@0.150.0/http/server.ts';
export { dirname, extname, fromFileUrl, join } from 'https://deno.land/std@0.150.0/path/mod.ts';
import { deleteCookie, getCookies, setCookie } from 'https://deno.land/std@0.150.0/http/cookie.ts';
export const Cookie = { get: getCookies, set: setCookie, delete: deleteCookie };
export { Status, STATUS_TEXT } from 'https://deno.land/std@0.150.0/http/http_status.ts';
