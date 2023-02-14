/**
 * Minirachne server response.
 */
export class ServerResponse {
	static JSON(data: any, init?: ResponseInit) {
		if (!init) {
			init = {};
		}
		init.headers = new Headers(init.headers);
		init.headers.set('content-type', 'application/json');
		return Promise.resolve(new Response(JSON.stringify(data), init));
	}

	constructor() {
		this.jsonHeader = new Headers();
		this.jsonHeader.set('content-type', 'application/json');
	}

	public jsonHeader: Headers;
	public json(data: any, init?: ResponseInit) {
		if (!init) {
			init = {};
		}
		const headers = new Headers(this.jsonHeader);
		if (init.headers) {
			init.headers = new Headers(init.headers);
			// Merge
			for (const key in headers) {
				if (!init.headers.get(key)) {
					init.headers.set(key, <string> headers.get(key));
				}
			}
		} else {
			init.headers = headers;
		}

		return ServerResponse.JSON(data, init);
	}
}
