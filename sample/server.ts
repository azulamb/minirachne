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
	public middlewares: Minirachne.Middlewares;

	constructor(server: Minirachne.Server) {
		this.pattern = server.router.path('/(login|logout|user)');
		this.middlewares = Minirachne.Middlewares.create(this);
	}

	public async onRequest(data: Minirachne.RequestData) {
		const headers = new Headers();
		headers.set('Location', '/');

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
				const headers = new Headers();
				headers.set('Content-Type', 'application/json');
				return new Response(JSON.stringify(data.user), {
					headers: headers,
				});
			}
		}

		return new Response('', { headers: headers, status: 303 });
	}

	// Middleware
	public async handle(data: Minirachne.RequestData) {
		const path = this.getPath(data.request);
		const user = this.getUser(data.request);
		if (path !== 'login' && !user) {
			return Promise.reject(new Error('Login Error.'));
		}
		// Add user data.
		data.user = user;
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
		headers.set('Content-Type', 'application/json');
		headers.set('Content-Length', encodeURI(body).replace(/%../g, '*').length + '');
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
	// Add path and RouteLike.
	server.router.add('/status', new StatusApi());

	// EchoChat. (WebSocket)
	// Add path and RouteLike with Middleware.
	server.router.add('/echochat', new EchoChat(server), simpleLogin.middlewares);

	// Private document root.
	const privateDocs = Minirachne.createAbsolutePath(import.meta, './private');
	server.router.add('/*', new Minirachne.StaticRoute(privateDocs), simpleLogin.middlewares);

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
	return server.run();
})().then(() => {
	console.log('Exit.');
}).catch((error) => {
	console.error(error);
});
