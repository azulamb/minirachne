import * as asserts from '../_setup.ts';
import { StaticRoute } from '../../src/static.ts';
import { HTTPError } from '../../src/http_error.ts';
import { createAbsolutePath } from '../../mod.ts';

const testDir = createAbsolutePath(import.meta, '../tmp');

function createHeaders(base: Headers, headers: { [keys: string]: string }) {
	const newHeaders = new Headers(base);

	Object.keys(headers).forEach((key) => {
		newHeaders.set(key, headers[key]);
	});

	return newHeaders;
}

Deno.test('Static Route', async () => {
	const route = new StaticRoute(testDir);
	route.pattern = new URLPattern({ pathname: '/*' });

	route.setMIMETypes({ 'json2': 'application/json' });
	const baseHeaders = new Headers({
		'Accept-Ranges': 'bytes',
		'Access-Control-Allow-Origin': '*',
	});

	const list: { url: string; reqInit: RequestInit; headers: Headers; status?: number }[] = [
		{
			url: 'http://localhost/sample.json',
			reqInit: { method: 'HEAD' },
			headers: createHeaders(baseHeaders, { 'content-length': '19', 'content-type': 'application/json' }),
		},
		{
			url: 'http://localhost/notfound',
			reqInit: { method: 'HEAD' },
			headers: createHeaders(baseHeaders, { 'content-type': 'text/plain;charset=UTF-8' }),
			status: 404,
		},
		{
			url: 'http://localhost/notfound',
			reqInit: { method: 'POST' },
			headers: createHeaders(baseHeaders, { 'content-type': 'text/plain;charset=UTF-8' }),
			status: 405,
		},
	];

	for (const item of list) {
		await route.onRequest({ request: new Request(item.url, item.reqInit), detail: {} })
			.catch((error) => {
				if (error instanceof HTTPError) {
					return error.createResponse();
				}
				throw error;
			})
			.then((result) => {
				asserts.assertEquals(result.status, item.status || 200, `Error: ${item.url} - ${result.status}`);
				for (const header of result.headers) {
					const [key, value] = header;
					const expected = item.headers.get(key);
					asserts.assertEquals(value, expected, `Error url: ${item.url} Header[${key}] "${value}" != "${expected}"`);
				}
				for (const header of item.headers) {
					const [key, value] = header;
					const expected = item.headers.get(key);
					if (expected) {
						// Tested value.
						continue;
					}
					asserts.assertEquals(value, expected, `Error url: ${item.url} Header[${key}] notfound.`);
				}
			});
	}

	await route.onRequest({ request: new Request('http://localhost/sample.json', { headers: { Range: 'bytes=2-7' } }), detail: {} }).then((response) => {
		return response.text();
	}).then((body) => {
		asserts.assertEquals(body, '"hoge"');
	}).catch((e) => {
		asserts.assertEquals(e, null, 'Range error.');
	});

	asserts.assertRejects(
		() => {
			return route.onRequest({ request: new Request('http://localhost/sample.json', { headers: { Range: 'bytes=1000-' } }), detail: {} });
		},
		Error,
		'Range Not Satisfiable',
	);

	asserts.assertRejects(
		() => {
			return route.onRequest({ request: new Request('http://localhost/notfound'), detail: {} });
		},
		Error,
		'Notfound',
	);

	route.setNotfound(() => {
		return Promise.reject(new Error('Notfound2'));
	});
	asserts.assertRejects(
		() => {
			return route.onRequest({ request: new Request('http://localhost/notfound'), detail: {} });
		},
		Error,
		'Notfound2',
	);
});
