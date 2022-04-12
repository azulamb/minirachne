import * as asserts from '../_setup.ts';
import { HTTPErrors, HTTPError } from '../../src/httperror.ts';
import { STATUS_TEXT } from '../../src/denostd.ts';


Deno.test('Middrewares manage', async () => {
	const Error404: { func: () => HTTPError, code: number }[] = [
		{ func: HTTPErrors.BadRequest, code: 400 },
		{ func: HTTPErrors.Unauthorixed, code: 401 },
		{ func: HTTPErrors.PaymentRequired, code: 402 },
		{ func: HTTPErrors.Forbidden, code: 403 },
		{ func: HTTPErrors.NotFound, code: 404 },
		{ func: HTTPErrors.MethodNotAllowed, code: 405 },
		{ func: HTTPErrors.NotAcceptable, code: 406 },
		{ func: HTTPErrors.ProxyAuthenticationRequired, code: 407 },
		{ func: HTTPErrors.RequestTimeout, code: 408 },
		{ func: HTTPErrors.Conflict, code: 409 },
		{ func: HTTPErrors.Gone, code: 410 },
		{ func: HTTPErrors.LengthRequired, code: 411 },
		{ func: HTTPErrors.PreconditionFailed, code: 412 },
		{ func: HTTPErrors.RequestEntityTooLarge, code: 413},
		{ func: HTTPErrors.RequestURITooLarge, code: 414 },
		{ func: HTTPErrors.UnsupportedMediaType, code: 415 },
		{ func: HTTPErrors.RequestedRangeNotSatisfiable, code: 416},
		{ func: HTTPErrors.ExpectationFailed, code: 417},
	];

	for(const e of Error404)
	{
		const error = e.func();
		asserts.assertEquals(error.responseInit.status, e.code);
		asserts.assertEquals(error.message, STATUS_TEXT.get(e.code));
	}
});
