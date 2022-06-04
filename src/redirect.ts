function CreateResponse(status: number, redirect: string, responseInit?: ResponseInit) {
	if (!responseInit) {
		responseInit = {};
	}

	const headers = new Headers(responseInit.headers);
	headers.set('Location', redirect);

	responseInit.status = status;
	responseInit.headers = headers;

	return new Response(null, responseInit);
}

/** Create Redirect Response. */
export const Redirect = {
	/** 300 Multiple Choice */
	MultipleChoices: (redirect: string, responseInit?: ResponseInit) => {
		return CreateResponse(300, redirect, responseInit);
	},
	/** 301 Moved Permanently */
	MovedPermanently: (redirect: string, responseInit?: ResponseInit) => {
		return CreateResponse(301, redirect, responseInit);
	},
	/** 302 Found */
	Found: (redirect: string, responseInit?: ResponseInit) => {
		return CreateResponse(302, redirect, responseInit);
	},
	/** 303 See Other */
	SeeOther: (redirect: string, responseInit?: ResponseInit) => {
		return CreateResponse(303, redirect, responseInit);
	},
	/** 304 Not Modified */
	NotModified: (redirect: string, responseInit?: ResponseInit) => {
		return CreateResponse(304, redirect, responseInit);
	},
	/** 307 Temporary Redirect */
	TemporaryRedirect: (redirect: string, responseInit?: ResponseInit) => {
		return CreateResponse(307, redirect, responseInit);
	},
	/** 308 Permanent Redirect */
	PermanentRedirect: (redirect: string, responseInit?: ResponseInit) => {
		return CreateResponse(308, redirect, responseInit);
	},
};
