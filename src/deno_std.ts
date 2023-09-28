/** Use Deno.std version. */
export { dirname, extname, fromFileUrl, join } from '$std/path/mod.ts';
import { deleteCookie, getCookies, setCookie } from '$std/http/cookie.ts';
export const Cookie = { get: getCookies, set: setCookie, delete: deleteCookie };
export { Status, STATUS_TEXT } from '$std/http/http_status.ts';
