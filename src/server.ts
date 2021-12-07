import { RequestData } from '../types.d.ts';
import { serve, serveTls } from './denostd.ts';
import { Router } from './router.ts';
import * as httpres from './httpres.ts';

export class Server {
	private url: URL = new URL('localhost:8080');
	private files: { keyFile: string; certFile: string } = {
		keyFile: '',
		certFile: '',
	};
	private controller!: AbortController;
	public router!: Router;

	constructor() {
		this.controller = new AbortController();
		this.router = new Router(this.url.origin);
	}

	public setURL(url: URL) {
		this.url = url;
		this.router.set(url.origin);
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
				});
			},
			{
				signal: this.controller.signal,
				addr: this.url.host,
				keyFile: this.files.keyFile,
				certFile: this.files.certFile,
			},
		);
	}

	protected async onRequest(data: RequestData) {
		const url = data.request.url;
		const response = await this.router.exec(url, async (route) => {
			if (!route.middlewares) {
				return route.onRequest(data);
			}

			return route.middlewares.exec(data).then(() => {
				return route.onRequest(data);
			});
		});

		if (response) {
			return response;
		}

		return httpres.notFound();
	}
}
