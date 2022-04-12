import { RequestData } from '../types.d.ts';
import { serve, serveTls } from './denostd.ts';
import { Router } from './router.ts';
import { HTTPError, HTTPErrors } from './httperror.ts';
import { SetupWebSocket, WebSocketListener } from './ws.ts';

export class Server {
	protected url: URL = new URL('http://localhost:8080/');
	protected files: { keyFile: string; certFile: string } = {
		keyFile: '',
		certFile: '',
	};
	protected controller!: AbortController;
	public router!: Router;

	constructor() {
		this.controller = new AbortController();
		this.router = new Router();
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

	public run() {
		return (this.url.protocol === 'https:' ? serveTls : serve)(
			(request, connInfo) => {
				return this.onRequest({
					request: request,
					connection: connInfo,
					detail: {},
				});
			},
			{
				port: parseInt(this.url.port),
				signal: this.controller.signal,
				hostname: this.url.hostname,
				keyFile: this.files.keyFile,
				certFile: this.files.certFile,
			},
		);
	}

	protected async onRequest(data: RequestData) {
		const url = data.request.url;

		try {
			const response = await this.router.exec(url, async (route) => {
				if (!route.middlewares) {
					return route.onRequest(data);
				}

				return route.middlewares.exec(data).then(() => {
					return route.onRequest(data);
				});
			});

			if (!response) {
				throw new Error('UNKNOWN ERROR!!');
			}
			return response;
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
