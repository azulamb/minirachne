import { Status, STATUS_TEXT } from './denostd.ts';

function createResponseInit(status: number, responseInit?: ResponseInit): ResponseInit {
	responseInit = responseInit ? responseInit : {};
	responseInit.status = status;
	responseInit.statusText = STATUS_TEXT.get(responseInit.status);

	return responseInit;
}

export function notFound(responseInit?: ResponseInit) {
	responseInit = createResponseInit(Status.NotFound, responseInit);
	return Promise.resolve(new Response(responseInit.statusText, responseInit));
}

export function requestedRangeNotSatisfiable(responseInit?: ResponseInit) {
	responseInit = createResponseInit(Status.RequestedRangeNotSatisfiable, responseInit);
	return Promise.resolve(new Response(responseInit.statusText, responseInit));
}

export function methodNotAllowed(responseInit?: ResponseInit) {
	responseInit = createResponseInit(Status.MethodNotAllowed, responseInit);
	return Promise.resolve(new Response(responseInit.statusText, responseInit));
}
