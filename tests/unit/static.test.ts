import * as asserts from '../_setup.ts';
import { StaticRoute } from '../../src/static.ts';
import { createAbsolutePath } from '../../mod.ts';

const testDir = createAbsolutePath(import.meta, '../tmp');

console.log(111);
const route = new StaticRoute(testDir);
route.pattern = new URLPattern('/*', 'http://localhost/');
await route.onRequest({ request: new Request('http://localhost/sample.json', { headers: { Range: 'bytes=1000-' } }) }).then((response) => {
	console.log(response.status);
}).catch((e) => {
	console.log(e);
});
console.log(222);

Deno.test('Static Route', async () => {
	const route = new StaticRoute(testDir);
	route.pattern = new URLPattern('/*', 'http://localhost/');

	route.setMIMETypes({ 'json2': 'application/json' });

	const list: { url: string; reqInit: RequestInit; headers: Headers; status?: number }[] = [
		{
			url: 'http://localhost/sample.json',
			reqInit: { method: 'HEAD' },
			headers: new Headers({ 'Accept-Ranges': 'bytes', 'content-length': '19', 'content-type': 'application/json' }),
		},
		{
			url: 'http://localhost/sample.json2',
			reqInit: { method: 'HEAD' },
			headers: new Headers({ 'Accept-Ranges': 'bytes', 'content-length': '19', 'content-type': 'application/json' }),
		},
		{
			url: 'http://localhost/notfound',
			reqInit: { method: 'HEAD' },
			headers: new Headers({ 'content-type': 'text/plain;charset=UTF-8' }),
			status: 404,
		},
		{
			url: 'http://localhost/notfound',
			reqInit: { method: 'POST' },
			headers: new Headers({ 'content-type': 'text/plain;charset=UTF-8' }),
			status: 405,
		},
	];

	for (const item of list) {
		await route.onRequest({ request: new Request(item.url, item.reqInit) }).then((result) => {
			asserts.assertEquals(result.status, item.status || 200);
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

	await route.onRequest({ request: new Request('http://localhost/sample.json', { headers: { Range: 'bytes=2-7' } }) }).then((response) => {
		return response.text();
	}).then((body) => {
		asserts.assertEquals(body, '"hoge"');
	}).catch((e) => {
		asserts.assertEquals(e, null, 'Range error.');
	});

	await route.onRequest({ request: new Request('http://localhost/sample.json', { headers: { Range: 'bytes=1000-' } }) }).then((response) => {
		asserts.assertEquals(response.status, 416);
	}).catch((e) => {
		asserts.assertEquals(e, null, 'Over Range error.');
	});

	route.setNotfound(false);
	asserts.assertRejects(
		() => {
			return route.onRequest({ request: new Request('http://localhost/notfound') });
		},
		Error,
		'Notfound',
	);

	route.setNotfound(() => {
		return Promise.reject(new Error('Notfound2'));
	});
	asserts.assertRejects(
		() => {
			return route.onRequest({ request: new Request('http://localhost/notfound') });
		},
		Error,
		'Notfound2',
	);
});
