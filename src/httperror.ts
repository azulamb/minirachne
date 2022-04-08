import { STATUS_TEXT } from './denostd.ts';

export class HTTPError extends Error {
	public responseInit?: ResponseInit;

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
	/** 404 Not Found */
	static notFound(responseInit?: ResponseInit) {
		return new HTTPError(404, responseInit);
	}
	/** 405 Method Not Allowed */
	static methodNotAllowed(responseInit?: ResponseInit) {
		return new HTTPError(405, responseInit);
	}
	/** 416 Requested Range Not Satisfiable */
	static requestedRangeNotSatisfiable(responseInit?: ResponseInit) {
		return new HTTPError(416, responseInit);
	}
	/** 500 Internal Server Error */
	static internalServerError(responseInit?: ResponseInit) {
		return new HTTPError(500, responseInit);
	}
}

function createResponseInit(status: number, responseInit?: ResponseInit): ResponseInit {
	responseInit = responseInit ? responseInit : {};
	responseInit.status = status;
	responseInit.statusText = STATUS_TEXT.get(responseInit.status);

	return responseInit;
}
