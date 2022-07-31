import * as asserts from '../_setup.ts';
import { Redirect } from '../../src/redirect.ts';
import { STATUS_TEXT, Status } from '../../src/deno_std.ts';

Deno.test('Redirect', async () => {
	const Redirects: { name: string; code: Status }[] = [];
	for(const key in STATUS_TEXT) {
		const code: Status = typeof key === 'number' ? key : parseInt(key);
		if (code < 300 || 400 <= code) {
			continue;
		}
		const value = STATUS_TEXT[code];
		Redirects.push({
			name: value.replace(/\s/g, ''),
			code: code,
		});
	}

	const redirects: { [keys: string]: (redirect: string, responseInit?: ResponseInit) => Response } = Redirect;
	for (const redirect of Redirects) {
		asserts.assertExists(redirects[redirect.name], `Notfound Redirect.${redirect.name}`);
		const url = '/test';
		const response = redirects[redirect.name](url);
		asserts.assertEquals(response.headers.get('Location'), url);
		asserts.assertEquals(response.status, redirect.code);
	}
});
