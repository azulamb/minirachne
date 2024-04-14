import * as asserts from '../../_setup.ts';
import { HTTPError } from '../../../src/http_error.ts';
import { STATUS_TEXT } from '../../../src/deno_std.ts';
import { BasicAuth } from '../../../src/middleware/basic_auth.ts';
import { RequestData } from '../../../types.d.ts';

Deno.test('Basic auth: Unauthorized', async () => {
	const basicAuth = new BasicAuth();

	const data: RequestData = {
		request: new Request(new URL('http://localhost/')),
		detail: {},
	};
	asserts.assertRejects(
		() => {
			return basicAuth.handle(data);
		},
		HTTPError,
		STATUS_TEXT[401],
	).then((result) => {
		asserts.assertFalse(result.getPropagation());
	});
});

Deno.test('Basic auth: Success', async () => {
	const user = Math.random().toString(32).substring(2);
	const password = Math.random().toString(32).substring(2);
	const base64 = btoa(`${user}:${password}`);

	const basicAuth = new BasicAuth().addUser(user, password);

	const data: RequestData = {
		request: new Request(new URL('http://localhost/'), {
			headers: {
				'Authorization': `Basic ${base64}`,
			},
		}),
		detail: {},
	};

	const result = await basicAuth.handle(data);
	asserts.assertEquals(result, undefined);
});

Deno.test('Basic auth: Failure', async () => {
	const user = Math.random().toString(32).substring(2);
	const password = Math.random().toString(32).substring(2);
	const base64 = btoa(`${user}:${password}`);
	const mode = Math.random() < 0.5;

	const basicAuth = new BasicAuth().addUser(
		mode ? user : Math.random().toString(32).substring(2),
		mode ? Math.random().toString(32).substring(2) : password,
	);

	const data: RequestData = {
		request: new Request(new URL('http://localhost/'), {
			headers: {
				'Authorization': `Basic ${base64}`,
			},
		}),
		detail: {},
	};

	asserts.assertRejects(
		() => {
			return basicAuth.handle(data);
		},
		HTTPError,
		STATUS_TEXT[401],
	).then((result) => {
		asserts.assertFalse(result.getPropagation());
	});
});
