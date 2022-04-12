import { join } from './denostd.ts';
import { RequestData, Route } from '../types.d.ts';
import { MIMETYPES, MIMETypes } from './mime.ts';
import { HTTPError, HTTPErrors } from './httperror.ts';

interface NotfoundCallback {
	(data: RequestData): Promise<Response>;
}

export class StaticRoute implements Route {
	public DEFAULT_CHUNK_SIZE = 16640;
	public order!: number;
	public pattern!: URLPattern;
	protected docs!: string;
	protected headers!: Headers;
	protected notfound!: NotfoundCallback;
	protected directoryIndex: string[] = ['index.html'];
	protected mime!: MIMETypes;

	constructor(docs: string, option?: { order?: number; pattern?: string | URLPattern }) {
		if (option) {
			if (option.order) {
				this.order = option.order;
			}
			if (option.pattern) {
				this.pattern = typeof option.pattern === 'string' ? new URLPattern(option.pattern) : option.pattern;
			}
		}

		this.docs = join(docs, '/');
		this.setBaseHeader(new Headers());
		this.setNotfound();
		this.mime = new MIMETypes();
	}

	public setBaseHeader(headers: Headers)
	{
		this.headers = headers;
	}

	/**
	 * @param response Callback. Set default if none.
	 */
	public setNotfound(callback?: NotfoundCallback) {
		if (!callback) {
			this.notfound = () => {
				return Promise.reject(HTTPErrors.NotFound());
			};
			return this;
		}

		this.notfound = callback;

		return this;
	}

	protected responseNotfound(data: RequestData) {
		return this.notfound(data);
	}

	public setDirectoryIndex(...directoryIndex: string[]) {
		this.directoryIndex = directoryIndex;

		return this;
	}

	public setMIMETypes(mime: MIMETYPES) {
		this.mime.set(mime);
		return this;
	}

	protected async responseDirectory(data: RequestData, basePath: string) {
		for (const index of this.directoryIndex) {
			try {
				const response = await this.responseFile(
					data.request.method === 'HEAD',
					join(basePath, index),
					data.request.headers,
				);

				return response;
				// deno-lint-ignore no-unused-vars no-empty
			} catch (error) {
			}
		}

		return this.responseNotfound(data);
	}

	protected async createReadableStream(filePath: string, range: { start: number; end: number }) {
		const file = await Deno.open(filePath);

		const bytes = new Uint8Array(this.DEFAULT_CHUNK_SIZE);
		const contentLength = range.end - range.start + 1;
		let bytesSent = 0;
		return new ReadableStream({
			async start() {
				await file.seek(range.start, Deno.SeekMode.Start);
			},
			async pull(controller) {
				const bytesRead = await file.read(bytes);
				if (bytesRead === null) {
					file.close();
					controller.close();
					return;
				}
				controller.enqueue(
					bytes.slice(0, Math.min(bytesRead, contentLength - bytesSent)),
				);
				bytesSent += bytesRead;
				if (contentLength < bytesSent) {
					file.close();
					controller.close();
				}
			},
		});
	}

	protected parseRange(headers: Headers, stat: Deno.FileInfo) {
		const result = /bytes=(\d+)-(\d+)?/.exec(headers.get('range') || '');
		const size = stat.size - 1;
		const range = { start: 0, end: size, full: false, exists: !!result };
		if (result) {
			range.start = result[1] ? parseInt(result[1]) : 0;
			range.end = result[2] ? parseInt(result[2]) : size;
		}
		range.full = range.start === 0 && range.end === size;

		return range;
	}

	protected async responseFile(
		head: boolean,
		filePath: string,
		headers: Headers,
		stat?: Deno.FileInfo,
	) {
		if (!stat) {
			stat = await Deno.stat(filePath);
		}

		const responseInit: ResponseInit = {};

		const range = this.parseRange(headers, stat);
		const max = stat.size - 1;

		if (range.exists && (range.end < range.start || max < range.start || max < range.end)) {
			return this.createHeader(filePath, stat, range.exists ? range : null).then((headers) => {
				responseInit.headers = headers;
				return Promise.reject(HTTPErrors.RequestedRangeNotSatisfiable(responseInit));
			});
		}

		if (head) {
			return this.createHeader(filePath, stat, range.exists ? range : null).then((headers) => {
				responseInit.headers = headers;
				return new Response('', responseInit);
			});
		}

		return this.createReadableStream(filePath, range).then(
			async (readableStream) => {
				responseInit.headers = await this.createHeader(filePath, <Deno.FileInfo> stat, range.exists ? range : null);

				return new Response(readableStream, responseInit);
			},
		);
	}

	protected async createHeader(filePath: string, stat: Deno.FileInfo, range: { start: number; end: number } | null) {
		const headers = new Headers(this.headers);

		const mime = this.mime.getFromPath(filePath);
		if (mime) {
			headers.set('Content-Type', mime);
		}

		headers.set('Accept-Ranges', 'bytes');

		if (range) {
			headers.set('Content-Range', `bytes ${range.start}-${range.end}/${stat.size}`);
		} else {
			headers.set('Content-Length', stat.size + '');
		}

		return headers;
	}

	protected createPath(request: Request) {
		const result = this.pattern.exec(request.url);
		const path = result?.pathname.groups[0];

		return join(this.docs, path || '');
	}

	public async onRequest(data: RequestData) {
		const path = this.createPath(data.request);

		switch (data.request.method) {
			case 'GET':
			case 'HEAD':
				break;
			default:
				return Promise.reject(HTTPErrors.MethodNotAllowed());
		}

		return Deno.stat(path).then((stat) => {
			return stat.isDirectory ? this.responseDirectory(data, path) : this.responseFile(data.request.method === 'HEAD', path, data.request.headers, stat);
		}).catch((error) => {
			if (error instanceof HTTPError) {
				throw error;
			}
			// TODO: set error and debug flag.
			return this.responseNotfound(data);
		});
	}
}
