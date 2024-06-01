/**
 * Minirachne server response.
 */
export class ServerResponse {
  // deno-lint-ignore no-explicit-any
  static JSON(data: any, init?: ResponseInit): Promise<Response> {
    if (!init) {
      init = {};
    }
    const headers = new Headers(init.headers);
    headers.set('content-type', 'application/json');
    init.headers = headers;
    return Promise.resolve(new Response(JSON.stringify(data), init));
  }

  constructor() {
    this.jsonHeader = new Headers();
    this.jsonHeader.set('content-type', 'application/json');
  }

  public jsonHeader: Headers;
  // deno-lint-ignore no-explicit-any
  public json(data: any, init?: ResponseInit): Promise<Response> {
    if (!init) {
      init = {};
    }
    const headers = new Headers(this.jsonHeader);
    if (init.headers) {
      const headers = new Headers(init.headers);
      // Merge
      for (const key in headers) {
        if (!headers.get(key)) {
          headers.set(key, <string> headers.get(key));
        }
      }
    } else {
      init.headers = headers;
    }

    return ServerResponse.JSON(data, init);
  }
}
