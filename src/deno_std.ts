/** Use Deno.std version. */
export { dirname, extname, fromFileUrl, join } from 'jsr:@std/path@^0.225.1';
import { deleteCookie, getCookies, setCookie } from 'jsr:@std/http@^0.224.2/cookie';
export const Cookie = { get: getCookies, set: setCookie, delete: deleteCookie };
export { STATUS_TEXT } from 'jsr:@std/http@^0.224.2/status';
import { STATUS_TEXT as HTTP_STATUS_TEXT } from 'jsr:@std/http@^0.224.2/status';
export function GetHttpStatusText(code: number) {
  return HTTP_STATUS_TEXT[<200> code] || 'UNKNOWN';
}
