import type { RequestData } from '../types.d.ts';
//import { serve, serveTls } from './deno_std.ts';
import { Router } from './router.ts';
import { HTTPError, HTTPErrors } from './http_error.ts';
import { SetupWebSocket, type WebSocketListener } from './ws.ts';
import { onRequest } from './on_request.ts';
import { ServerResponse } from './response.ts';

/**
 * Minirachne server.
 */
export class Server {
  protected url: URL = new URL('http://localhost:0/');
  protected files: { keyFile: string; certFile: string } = {
    keyFile: '',
    certFile: '',
  };
  protected controller!: AbortController;
  protected status = false;
  public router!: Router;
  public response!: ServerResponse;

  constructor() {
    this.controller = new AbortController();
    this.router = new Router();
    this.response = new ServerResponse();
  }

  public getURL(): URL {
    return new URL(this.url.toString());
  }

  public setURL(url: URL): this {
    this.url = new URL(url.toString());

    return this;
  }

  public setCertFile(keyFile: string, certFile: string): this {
    this.files.keyFile = keyFile;
    this.files.certFile = certFile;
    return this;
  }

  public stop() {
    this.controller.abort();
  }

  protected getConfig(): Deno.ServeOptions | (Deno.ServeTcpOptions & Deno.TlsCertifiedKeyPem) {
    if (this.files.keyFile && this.files.certFile) {
      return {
        port: parseInt(this.url.port),
        signal: this.controller.signal,
        hostname: this.url.hostname,
        key: this.files.keyFile,
        cert: this.files.certFile,
      };
    }
    return {
      port: parseInt(this.url.port),
      signal: this.controller.signal,
      hostname: this.url.hostname,
    };
  }

  public start(onStart?: (server: Server) => unknown): Promise<void> {
    if (this.status) {
      return Promise.reject(new Error('Server started.'));
    }
    this.status = true;

    const server = Deno.serve(
      this.getConfig(),
      (request, info) => {
        return this.onRequest({
          request: request,
          info: info,
          detail: {},
        });
      },
    );
    this.url.port = server.addr.port.toString();
    if (onStart) {
      onStart(this);
    }
    return server.finished;
  }

  protected async onRequest(data: RequestData): Promise<Response> {
    try {
      return await onRequest(data, this.router);
    } catch (error) {
      if (error instanceof HTTPError) {
        return error.createResponse();
      }
    }

    return HTTPErrors.server.InternalServerError().createResponse();
  }

  public upgradeWebSocket(data: RequestData, webSocketEvent: WebSocketListener, options?: Deno.UpgradeWebSocketOptions): Response {
    return SetupWebSocket(data.request, webSocketEvent, options);
  }
}
