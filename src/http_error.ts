import { GetHttpStatusText } from './deno_std.ts';

/**
 * HTTPError has Error response.
 */
export class HTTPError extends Error {
  public responseInit: ResponseInit;
  protected propagation = true;
  // TODO: response body.

  /**
   * @param status HTTP Status code.
   */
  constructor(status: number, responseInit?: ResponseInit) {
    super(GetHttpStatusText(status) || 'UNKNOWN');
    this.name = 'HTTPError';
    this.responseInit = createResponseInit(status, responseInit);
  }

  public createResponse() {
    return Promise.resolve(new Response(this.message, this.responseInit));
  }

  public setPropagation(propagation: boolean) {
    this.propagation = propagation;
    return this;
  }

  public getPropagation() {
    return this.propagation;
  }
}

export const HTTPErrors = {
  /** Client error. */
  client: {
    /** 400	Bad Request */
    BadRequest: (responseInit?: ResponseInit) => {
      return new HTTPError(400, responseInit);
    },
    /** 401 Not Found */
    Unauthorized: (responseInit?: ResponseInit) => {
      return new HTTPError(401, responseInit);
    },
    /** 402	Payment Required */
    PaymentRequired: (responseInit?: ResponseInit) => {
      return new HTTPError(402, responseInit);
    },
    /** 403	Forbidden */
    Forbidden: (responseInit?: ResponseInit) => {
      return new HTTPError(403, responseInit);
    },
    /** 404 Not Found */
    NotFound: (responseInit?: ResponseInit) => {
      return new HTTPError(404, responseInit);
    },
    /** 405 Method Not Allowed */
    MethodNotAllowed: (responseInit?: ResponseInit) => {
      return new HTTPError(405, responseInit);
    },
    /** 406 Not Acceptable */
    NotAcceptable: (responseInit?: ResponseInit) => {
      return new HTTPError(406, responseInit);
    },
    /** 407 Proxy Auth Required */
    ProxyAuthenticationRequired: (responseInit?: ResponseInit) => {
      return new HTTPError(407, responseInit);
    },
    /** 407 Proxy Auth Required */
    ProxyAuthRequired: (responseInit?: ResponseInit) => {
      return new HTTPError(407, responseInit);
    },
    /** 408	Request Time-out */
    RequestTimeout: (responseInit?: ResponseInit) => {
      return new HTTPError(408, responseInit);
    },
    /** 409	Conflict */
    Conflict: (responseInit?: ResponseInit) => {
      return new HTTPError(409, responseInit);
    },
    /** 410	Gone */
    Gone: (responseInit?: ResponseInit) => {
      return new HTTPError(410, responseInit);
    },
    /** 411	Length Required */
    LengthRequired: (responseInit?: ResponseInit) => {
      return new HTTPError(411, responseInit);
    },
    /** 412	Precondition Failed */
    PreconditionFailed: (responseInit?: ResponseInit) => {
      return new HTTPError(412, responseInit);
    },
    /** 413	Request Entity Too Large */
    ContentTooLarge: (responseInit?: ResponseInit) => {
      return new HTTPError(413, responseInit);
    },
    /** 414	URI Too Long */
    URITooLong: (responseInit?: ResponseInit) => {
      return new HTTPError(414, responseInit);
    },
    /** 415	Unsupported Media Type */
    UnsupportedMediaType: (responseInit?: ResponseInit) => {
      return new HTTPError(415, responseInit);
    },
    /** 416 Requested Range Not Satisfiable */
    RangeNotSatisfiable: (responseInit?: ResponseInit) => {
      return new HTTPError(416, responseInit);
    },
    /** 417	Expectation Failed */
    ExpectationFailed: (responseInit?: ResponseInit) => {
      return new HTTPError(417, responseInit);
    },
    /** 418 I'm a teapot */
    Teapot: (responseInit?: ResponseInit) => {
      return new HTTPError(418, responseInit);
    },
    /** 421 Misdirected Request */
    MisdirectedRequest: (responseInit?: ResponseInit) => {
      return new HTTPError(421, responseInit);
    },
    /** 422 Unprocessable Entity */
    UnprocessableEntity: (responseInit?: ResponseInit) => {
      return new HTTPError(422, responseInit);
    },
    /** 423 Locked */
    Locked: (responseInit?: ResponseInit) => {
      return new HTTPError(423, responseInit);
    },
    /** 424 Failed Dependency */
    FailedDependency: (responseInit?: ResponseInit) => {
      return new HTTPError(424, responseInit);
    },
    /** 425 Too Early */
    TooEarly: (responseInit?: ResponseInit) => {
      return new HTTPError(425, responseInit);
    },
    /** 426 Upgrade Required */
    UpgradeRequired: (responseInit?: ResponseInit) => {
      return new HTTPError(426, responseInit);
    },
    /** 428 Precondition Required */
    PreconditionRequired: (responseInit?: ResponseInit) => {
      return new HTTPError(428, responseInit);
    },
    /** 429 Too Many Requests */
    TooManyRequests: (responseInit?: ResponseInit) => {
      return new HTTPError(429, responseInit);
    },
    /** 431 Request Header Fields Too Large */
    RequestHeaderFieldsTooLarge: (responseInit?: ResponseInit) => {
      return new HTTPError(431, responseInit);
    },
    /** 451 Unavailable For Legal Reasons */
    UnavailableForLegalReasons: (responseInit?: ResponseInit) => {
      return new HTTPError(451, responseInit);
    },
  },

  /** Server error. */
  server: {
    /** 500 Internal Server Error */
    InternalServerError: (responseInit?: ResponseInit) => {
      return new HTTPError(500, responseInit);
    },
    /** 501 Not Implemented */
    NotImplemented: (responseInit?: ResponseInit) => {
      return new HTTPError(501, responseInit);
    },
    /** 502 Bad Gateway */
    BadGateway: (responseInit?: ResponseInit) => {
      return new HTTPError(502, responseInit);
    },
    /** 503 Service Unavailable */
    ServiceUnavailable: (responseInit?: ResponseInit) => {
      return new HTTPError(503, responseInit);
    },
    /** 504 Gateway Timeout */
    GatewayTimeout: (responseInit?: ResponseInit) => {
      return new HTTPError(504, responseInit);
    },
    /** 505 HTTP Version Not Supported */
    HTTPVersionNotSupported: (responseInit?: ResponseInit) => {
      return new HTTPError(505, responseInit);
    },
    /** 506 Variant Also Negotiates */
    VariantAlsoNegotiates: (responseInit?: ResponseInit) => {
      return new HTTPError(506, responseInit);
    },
    /** 506 Variant Also Negotiates */
    InsufficientStorage: (responseInit?: ResponseInit) => {
      return new HTTPError(507, responseInit);
    },
    /** 508 Loop Detected */
    LoopDetected: (responseInit?: ResponseInit) => {
      return new HTTPError(508, responseInit);
    },
    /** 510 Not Extended */
    NotExtended: (responseInit?: ResponseInit) => {
      return new HTTPError(510, responseInit);
    },
    /** 511 Network Authentication Required */
    NetworkAuthenticationRequired: (responseInit?: ResponseInit) => {
      return new HTTPError(511, responseInit);
    },
  },
};

function createResponseInit(status: number, responseInit?: ResponseInit): ResponseInit {
  responseInit = responseInit ? responseInit : {};
  responseInit.status = status;
  responseInit.statusText = GetHttpStatusText(responseInit.status);

  return responseInit;
}
