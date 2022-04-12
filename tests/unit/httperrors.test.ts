import * as asserts from '../_setup.ts';
import { HTTPError, HTTPErrors } from '../../src/httperror.ts';
import { STATUS_TEXT } from '../../src/denostd.ts';

Deno.test('HTTPErrors client(4xx)', async () => {
	const Errors: { name: string; code: number }[] = [];
	const convert: { [keys: number]: string } = {
		418: 'Teapot',
	};
	STATUS_TEXT.forEach((v, k) => {
		if (k < 400 || 500 <= k) return;
		Errors.push({
			name: convert[k] || v.replace(/\s/g, ''),
			code: k,
		});
	});

	const errors: { [keys: string]: (responseInit?: ResponseInit) => HTTPError } = HTTPErrors.client;
	for (const e of Errors) {
		asserts.assertExists(errors[e.name], `Notfound HTTPErrors.${e.name}`);
		const error = errors[e.name]();
		asserts.assertEquals(error.responseInit.status, e.code);
		asserts.assertEquals(error.message, STATUS_TEXT.get(e.code));
	}
});

Deno.test('HTTPErrors server(5xx)', async () => {
	const Errors: { name: string; code: number }[] = [];
	const convert: { [keys: number]: string } = {};
	STATUS_TEXT.forEach((v, k) => {
		if (k < 500 || 600 <= k) return;
		Errors.push({
			name: convert[k] || v.replace(/\s/g, ''),
			code: k,
		});
	});

	const errors: { [keys: string]: (responseInit?: ResponseInit) => HTTPError } = HTTPErrors.server;
	for (const e of Errors) {
		asserts.assertExists(errors[e.name], `Notfound HTTPErrors.${e.name}`);
		const error = errors[e.name]();
		asserts.assertEquals(error.responseInit.status, e.code);
		asserts.assertEquals(error.message, STATUS_TEXT.get(e.code));
	}
});
