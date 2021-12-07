import { join } from './denostd.ts';
import { RequestData, Route } from '../types.d.ts';
import { MIMETYPES, MIMETypes } from './mime.ts';
import * as httpres from './httpres.ts';

interface NotfoundCallback {
	(data: RequestData): Promise<Response>;
}

export class StaticRoute implements Route {
	public DEFAULT_CHUNK_SIZE = 16640;
	public order: number;
	public pattern!: URLPattern;
	protected docs!: string;
	protected notfound!: NotfoundCallback;
	protected directoryIndex: string[] = ['index.html'];
	protected mime!: MIMETypes;

	constructor(order: number, pattern: string | URLPattern, docs: string) {
		this.order = order;
		this.pattern = typeof pattern === 'string' ? new URLPattern(pattern) : pattern;
		this.docs = join(docs, '/');
		this.disableNotfound();
		this.mime = new MIMETypes();
	}

	public setMIMETypes(mime: MIMETYPES) {
		this.mime.set(mime);
		return this;
	}

	public disableNotfound() {
		// Notfound => Next route.
		this.setNotfound(() => {
			return Promise.reject('Notfound');
		});
		return this;
	}

	public enableNotfound() {
		// This route is last route.
		this.setNotfound(() => {
			return httpres.notFound();
		});
		return this;
	}

	public setNotfound(response: NotfoundCallback) {
		this.notfound = response;

		return this;
	}

	protected responseNotfound(data: RequestData) {
		return this.notfound(data);
	}

	public setDirectoryIndex(...directoryIndex: string[]) {
		this.directoryIndex = directoryIndex;

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
				return httpres.requestedRangeNotSatisfiable(responseInit);
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
		const headers = new Headers();

		const mime = this.mime.get(filePath);
		if (mime) {
			headers.set('Content-Type', mime);
		}

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
				return httpres.methodNotAllowed();
		}

		return Deno.stat(path).then((stat) => {
			return stat.isDirectory ? this.responseDirectory(data, path) : this.responseFile(data.request.method === 'HEAD', path, data.request.headers, stat);
		}).catch((error) => {
			return this.responseNotfound(data);
		});
	}
}
