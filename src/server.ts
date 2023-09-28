import { RequestData } from '../types.d.ts';
//import { serve, serveTls } from './deno_std.ts';
import { Router } from './router.ts';
import { HTTPError, HTTPErrors } from './http_error.ts';
import { SetupWebSocket, WebSocketListener } from './ws.ts';
import { onRequest } from './on_request.ts';
import { ServerResponse } from './response.ts';

/**
 * Minirachne server.
 */
export class Server {
	protected url: URL = new URL('http://localhost:8080/');
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

	public getURL() {
		return new URL(this.url.toString());
	}

	public setURL(url: URL) {
		this.url = new URL(url.toString());

		return this;
	}

	public setCertFile(keyFile: string, certFile: string) {
		this.files.keyFile = keyFile;
		this.files.certFile = certFile;
		return this;
	}

	public stop() {
		this.controller.abort();
	}

	public start() {
		if (this.status) {
			return Promise.reject(new Error('Server started.'));
		}
		this.status = true;

		return Deno.serve(
			{
				port: parseInt(this.url.port),
				signal: this.controller.signal,
				hostname: this.url.hostname,
				key: this.files.keyFile,
				cert: this.files.certFile,
			},
			(request, info) => {
				return this.onRequest({
					request: request,
					info: info,
					detail: {},
				});
			},
		).finished;
	}

	protected async onRequest(data: RequestData) {
		try {
			return await onRequest(data, this.router);
		} catch (error) {
			if (error instanceof HTTPError) {
				return error.createResponse();
			}
		}

		return HTTPErrors.server.InternalServerError().createResponse();
	}

	public async upgradeWebSocket(data: RequestData, webSocketEvent: WebSocketListener, options?: Deno.UpgradeWebSocketOptions) {
		return SetupWebSocket(data.request, webSocketEvent, options);
	}
}
