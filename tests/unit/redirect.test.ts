import * as asserts from '../_setup.ts';
import { Redirect } from '../../src/redirect.ts';
import { STATUS_TEXT } from '../../src/denostd.ts';

Deno.test('Redirect', async () => {
	const Redirects: { name: string; code: number }[] = [];
	const exclude = [305];
	STATUS_TEXT.forEach((v, k) => {
		if (k < 300 || 400 <= k || exclude.includes(k)) return;
		Redirects.push({
			name: v.replace(/\s/g, ''),
			code: k,
		});
	});

	const redirects: { [keys: string]: (redirect: string, responseInit?: ResponseInit) => Response } = Redirect;
	for (const redirect of Redirects) {
		asserts.assertExists(redirects[redirect.name], `Notfound Redirect.${redirect.name}`);
		const url = '/test';
		const response = redirects[redirect.name](url);
		asserts.assertEquals(response.headers.get('Location'), url);
		asserts.assertEquals(response.status, redirect.code);
	}
});
