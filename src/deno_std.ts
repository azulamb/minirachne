/** Use Deno.std version. */
export { dirname, extname, fromFileUrl, join } from '$minirachne_std/path/mod.ts';
import { deleteCookie, getCookies, setCookie } from '$minirachne_std/http/cookie.ts';
export const Cookie = { get: getCookies, set: setCookie, delete: deleteCookie };
export { STATUS_TEXT } from '$minirachne_std/http/status.ts';
import { STATUS_TEXT as HTTP_STATUS_TEXT } from '$minirachne_std/http/status.ts';
export function GetHttpStatusText(code: number) {
	return HTTP_STATUS_TEXT[<200> code] || 'UNKNOWN';
}
