import { extname } from './denostd.ts';

export interface MIMETYPES {
	[keys: string]: string;
}

const DEFAULT: MIMETYPES = {
	aac: 'audio/aac',
	abw: 'application/x-abiword',
	arc: 'application/x-freearc',
	avi: 'video/x-msvideo',
	azw: 'application/vnd.amazon.ebook',
	bin: 'application/octet-stream',
	bmp: 'image/bmp',
	bz: 'application/x-bzip',
	bz2: 'application/x-bzip2',
	csh: 'application/x-csh',
	css: 'text/css',
	csv: 'text/csv',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	eot: 'application/vnd.ms-fontobject',
	epub: 'application/epub+zip',
	gif: 'image/gif',
	gz: 'application/gzip',
	htm: 'text/html',
	html: 'text/html',
	ico: 'image/vnd.microsoft.icon',
	jar: 'application/java-archive',
	jpeg: 'image/jpeg',
	jpg: 'image/jpeg',
	js: 'text/javascript',
	json: 'application/json',
	jsonld: 'application/ld+json',
	jsonp: 'application/javascript',
	mid: 'audio/midi',
	midi: 'audio/midi',
	mjs: 'text/javascript',
	mp3: 'audio/mpeg',
	mpeg: 'video/mpeg',
	odp: 'application/vnd.oasis.opendocument.presentation',
	ods: 'application/vnd.oasis.opendocument.spreadsheet',
	odt: 'application/vnd.oasis.opendocument.text',
	oga: 'audio/ogg',
	ogv: 'video/ogg',
	opus: 'audio/opus',
	otf: 'otf',
	pdf: 'application/pdf',
	png: 'image/png',
	pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
	rar: 'application/vnd.rar',
	rtf: 'application/rtf',
	sh: 'application/x-sh',
	svg: 'image/svg+xml',
	svgz: 'image/svg+xml',
	tar: 'application/x-tar',
	tif: 'image/tiff',
	tiff: 'image/tiff',
	ttf: 'font/ttf',
	txt: 'text/plain',
	vsd: 'application/vnd.visio',
	wasm: 'application/wasm',
	wav: 'audio/wav',
	weba: 'audio/webm',
	webm: 'audio/webm',
	webp: 'image/webp',
	woff: 'font/woff',
	woff2: 'font/woff2',
	xhtml: 'application/xhtml+xml',
	xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
	xml: 'text/xml',
	xul: 'application/vnd.mozilla.xul+xml',
	zip: 'application/zip',
	'7z': 'application/x-7z-compressed',
};

export class MIMETypes {
	protected mime: MIMETYPES = {};

	constructor(mime?: { [keys: string]: string }) {
		this.set(mime || DEFAULT);
	}

	public set(mime: MIMETYPES): this;
	public set(ext: string, value: string): this;
	set(mime: MIMETYPES | string, value?: string) {
		const m = (typeof mime === 'string') ? { mime: <string> value } : mime;
		Object.keys(m).forEach((key) => {
			const v = m[key];
			if (!v) return;
			const k = key.replace(/^\./, '');
			if (!k) return;
			this.mime[k] = v;
		});

		return this;
	}

	/**
	 * Get MIMEType from filepath.
	 * @param path File path. ex: dir/image.png
	 * @returns MIMEType or empty string.
	 */
	public getFromPath(path: string) {
		const ext = extname(path);
		return this.get(ext.substr(1));
	}

	/**
	 * Get MIMEType from filename extension.
	 * @param extension Filename extension. ex: png
	 * @returns MIMEType or empty string.
	 */
	public get(ext: string) {
		return this.mime[ext] || '';
	}
}
