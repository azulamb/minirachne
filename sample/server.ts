/**
 * Sample server.
 *
 * deno run --allow-read --allow-net --allow-env ./sample/server.ts
 */

//import * as Minirachne from '../mod.ts';
import * as Minirachne from 'https://raw.githubusercontent.com/Azulamb/minirachne/main/mod.ts';

// Middleware & Route
class SimpleLogin implements Minirachne.Route, Minirachne.Middleware {
	// Route
	public order!: number;
	public pattern!: URLPattern;
	public middleware: Minirachne.MiddlewareManager;

	constructor(server: Minirachne.Server, base = '') {
		this.pattern = server.router.path(`${base}/(login|logout|user)`);
		this.middleware = Minirachne.MiddlewareManager.create(this);
	}

	public async onRequest(data: Minirachne.RequestData) {
		const headers = new Headers();

		switch (this.getPath(data.request)) {
			case 'login': {
				console.log('Login user:');
				const uid = Math.random().toString(36).slice(-8);
				Minirachne.Cookie.set(headers, { name: 'login', value: uid });
				break;
			}
			case 'logout': {
				console.log('Logout user:');
				Minirachne.Cookie.delete(headers, 'login');
				break;
			}
			case 'user': {
				return Minirachne.Response.JSON(data.detail.user);
			}
		}

		return Minirachne.Redirect.SeeOther('/', { headers: headers });
	}

	// Middleware
	public async handle(data: Minirachne.RequestData) {
		const path = this.getPath(data.request);
		const user = this.getUser(data.request);
		if (path !== 'login' && !user) {
			return Promise.reject(new Error('Login Error.'));
		}
		// Add user data.
		data.detail.user = user;
	}

	// Common
	protected getPath(request: Request) {
		const result = this.pattern.exec(request.url);

		return result?.pathname.groups[0];
	}

	protected getUser(request: Request) {
		const cookie = Minirachne.Cookie.get(request.headers);

		return cookie.login ? { uid: cookie.login } : null;
	}
}

class StatusApi implements Minirachne.RouteLike {
	// RouteLike

	onRequest(data: Minirachne.RequestData): Promise<Response> {
		const body = JSON.stringify({
			framework: Minirachne.NAME,
			version: Minirachne.VERSION,
			std: Minirachne.STD_VERSION,
		});
		const headers = new Headers();
		headers.set('content-length', encodeURI(body).replace(/%../g, '*').length + '');
		const response = new Response(body, { headers: headers });
		return Promise.resolve(response);
	}
}

class EchoChat extends Minirachne.WebSocketListener implements Minirachne.RouteLike {
	private server!: Minirachne.Server;

	constructor(server: Minirachne.Server) {
		super();
		this.server = server;
	}

	// RouteLike

	public async onRequest(data: Minirachne.RequestData) {
		return this.server.upgradeWebSocket(data, this);
	}

	// WebSocketListener

	public onOpen(ws: WebSocket, event: Event) {
		console.log(`Start EchoChat:`);
	}

	public onMessage(ws: WebSocket, event: MessageEvent) {
		console.log(`Message EchoChat: ${event.data}`);
		ws.send(event.data);
	}

	public onClose(ws: WebSocket, event: CloseEvent) {
		console.log(`Close EchoChat:`);
	}

	public onError(ws: WebSocket, event: Event | ErrorEvent) {
		console.log(`Error EchoChat:`);
	}
}

(() => {
	const server = new Minirachne.Server();

	server.setURL(new URL(Deno.env.get('MINIRACHNE_URL') || 'http://localhost:8080/'));

	// Create login Route & Middleware.
	const simpleLogin = new SimpleLogin(server);
	// Add Route.
	server.router.add(simpleLogin);

	// API sample.

	// POST only API
	server.router.post('/postecho', async (data) => {
		const body = await data.request.text();
		return new Response(body);
	});

	// Add path and RouteLike.
	server.router.add('/status', new StatusApi());

	// Basic auth root.
	const basicAuth = new Minirachne.BasicAuth().addUser('USER', 'PASS');
	const basicDocs = Minirachne.createAbsolutePath(import.meta, './basic');
	server.router.add('/basic/*', new Minirachne.StaticRoute(basicDocs), basicAuth);

	// EchoChat. (WebSocket)
	// Add path and RouteLike with Middleware.
	server.router.add('/echochat', new EchoChat(server), simpleLogin.middleware);

	// Private document root.
	const privateDocs = Minirachne.createAbsolutePath(import.meta, './private');
	server.router.add('/*', new Minirachne.StaticRoute(privateDocs), simpleLogin.middleware);

	// Public document root.
	const publicDocs = Minirachne.createAbsolutePath(import.meta, './public');
	server.router.add('/*', new Minirachne.StaticRoute(publicDocs));
	// or
	//server.router.add(new URLPattern('http://localhost:8080/*'), new Minirachne.StaticRoute(publicDocs));

	/**
	 * Proirity
	 * - Simple login.
	 *     Login/Logout/Get user status api.
	 *     Use middleware(Simple login).
	 * - POST only API
	 *     Do not use middleware.
	 * - Status API
	 *     Do not use middleware.
	 * - EchoChat
	 *     Use middleware(Simple login).
	 * - Private static file server.
	 *     Use middleware(Simple login).
	 * - Public static file server.
	 *     Do not use middleware.
	 */
	console.log(`Start: ${server.getURL()}`);
	return server.start();
})().then(() => {
	console.log('Exit.');
}).catch((error) => {
	console.error(error);
});
