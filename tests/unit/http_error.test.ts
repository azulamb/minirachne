import * as asserts from '../_setup.ts';
import { HTTPError, HTTPErrors } from '../../src/http_error.ts';
import { STATUS_TEXT, Status } from '../../src/deno_std.ts';

Deno.test('HTTPErrors client(4xx)', async () => {
	const Errors: { name: string; code: Status }[] = [];
	const convert: { [keys: number]: string } = {
		418: 'Teapot',
	};
	for(const key in STATUS_TEXT) {
		const code: Status = typeof key === 'number' ? key : parseInt(key);
		if (code < 400 || 500 <= code) {
			continue;
		}
		const value = STATUS_TEXT[code];
		Errors.push({
			name: convert[code] || value.replace(/\s/g, ''),
			code: code,
		});
	}

	const errors: { [keys: string]: (responseInit?: ResponseInit) => HTTPError } = HTTPErrors.client;
	for (const e of Errors) {
		asserts.assertExists(errors[e.name], `Notfound HTTPErrors.${e.name}`);
		const error = errors[e.name]();
		asserts.assertEquals(error.responseInit.status, e.code);
		asserts.assertEquals(error.message, STATUS_TEXT[e.code]);
	}
});

Deno.test('HTTPErrors server(5xx)', async () => {
	const Errors: { name: string; code: Status }[] = [];
	const convert: { [keys: number]: string } = {};
	for(const key in STATUS_TEXT) {
		const code: Status = typeof key === 'number' ? key : parseInt(key);
		if (code < 500 || 600 <= code) {
			continue;
		}
		const value = STATUS_TEXT[code];
		Errors.push({
			name: convert[code] || value.replace(/\s/g, ''),
			code: code,
		});
	}

	const errors: { [keys: string]: (responseInit?: ResponseInit) => HTTPError } = HTTPErrors.server;
	for (const e of Errors) {
		asserts.assertExists(errors[e.name], `Notfound HTTPErrors.${e.name}`);
		const error = errors[e.name]();
		asserts.assertEquals(error.responseInit.status, e.code);
		asserts.assertEquals(error.message, STATUS_TEXT[e.code]);
	}
});
