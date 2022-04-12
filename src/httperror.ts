import { STATUS_TEXT } from './denostd.ts';

export class HTTPError extends Error {
	public responseInit: ResponseInit;

	constructor(status: number, responseInit?: ResponseInit) {
		super(STATUS_TEXT.get(status) || 'UNKNOWN');
		this.name = 'HTTPError';
		this.responseInit = createResponseInit(status, responseInit);
	}

	public createResponse() {
		return Promise.resolve(new Response(this.message, this.responseInit));
	}
}

export class HTTPErrors {
	/** 400	 */
	static BadRequest(responseInit?: ResponseInit) {
		return new HTTPError(400, responseInit);
	}
	/** 401 Not Found */
	static Unauthorixed(responseInit?: ResponseInit) {
		return new HTTPError(401, responseInit);
	}
	/** 402	Payment Required */
	static PaymentRequired(responseInit?: ResponseInit) {
		return new HTTPError(402, responseInit);
	}
	/** 403	Forbidden */
	static Forbidden(responseInit?: ResponseInit) {
		return new HTTPError(403, responseInit);
	}
	/** 404 Not Found */
	static NotFound(responseInit?: ResponseInit) {
		return new HTTPError(404, responseInit);
	}
	/** 405 Method Not Allowed */
	static MethodNotAllowed(responseInit?: ResponseInit) {
		return new HTTPError(405, responseInit);
	}
	/** 406 Method Not Allowed */
	static NotAcceptable(responseInit?: ResponseInit) {
		return new HTTPError(406, responseInit);
	}
	/** 407 Method Not Allowed */
	static ProxyAuthenticationRequired(responseInit?: ResponseInit) {
		return new HTTPError(407, responseInit);
	}
	/** 408	Request Time-out */
	static RequestTimeout(responseInit?: ResponseInit) {
		return new HTTPError(408, responseInit);
	}
	/** 409	Conflict */
	static Conflict(responseInit?: ResponseInit) {
		return new HTTPError(409, responseInit);
	}
	/** 410	Gone */
	static Gone(responseInit?: ResponseInit) {
		return new HTTPError(410, responseInit);
	}
	/** 411	Length Required */
	static LengthRequired(responseInit?: ResponseInit) {
		return new HTTPError(411, responseInit);
	}
	/** 412	Precondition Failed */
	static PreconditionFailed(responseInit?: ResponseInit) {
		return new HTTPError(412, responseInit);
	}
	/** 413	Request Entity Too Large */
	static RequestEntityTooLarge(responseInit?: ResponseInit) {
		return new HTTPError(413, responseInit);
	}
	/** 414	Request-URI Too Large */
	static RequestURITooLarge(responseInit?: ResponseInit) {
		return new HTTPError(414, responseInit);
	}
	/** 415	Unsupported Media Type */
	static UnsupportedMediaType(responseInit?: ResponseInit) {
		return new HTTPError(415, responseInit);
	}
	/** 416 Requested Range Not Satisfiable */
	static RequestedRangeNotSatisfiable(responseInit?: ResponseInit) {
		return new HTTPError(416, responseInit);
	}
	/** 417	Expectation Failed */
	static ExpectationFailed(responseInit?: ResponseInit) {
		return new HTTPError(417, responseInit);
	}

	/** 500 Internal Server Error */
	static InternalServerError(responseInit?: ResponseInit) {
		return new HTTPError(500, responseInit);
	}
}

function createResponseInit(status: number, responseInit?: ResponseInit): ResponseInit {
	responseInit = responseInit ? responseInit : {};
	responseInit.status = status;
	responseInit.statusText = STATUS_TEXT.get(responseInit.status);

	return responseInit;
}
