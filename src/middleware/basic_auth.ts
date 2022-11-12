import { Middleware, MiddlewareManager, RequestData, Route } from '../../types.d.ts';
import { HTTPErrors } from '../http_error.ts';

export class BasicAuth implements Route, Middleware {
	protected message: string;
	protected users: { [keys: string]: string } = {};

	// Route
	public order!: number;
	public pattern!: URLPattern;
	public middleware?: MiddlewareManager;

	constructor(message = 'SECRET AREA') {
		this.message = message;
	}

	onRequest(data: RequestData): Promise<Response> {
		// TODO: body.
		return Promise.resolve(
			HTTPErrors.client.Unauthorized({
				headers: {
					'WWW-Authenticate': `Basic realm="${this.message}"`,
				},
			}).createResponse(),
		);
	}

	// Middleware
	public async handle(data: RequestData) {
		try {
			const info = this.parseAuthorization(data.request.headers);
			if (!this.users[info.user]) {
				throw new Error('No user.');
			}
			if (this.users[info.user] !== info.password) {
				throw new Error('Invalid password.');
			}
		} catch (error) {
			return Promise.reject(error);
		}

		return Promise.resolve();
	}

	protected parseAuthorization(headers: Headers) {
		const auth = headers.get('Authorization');
		if (!auth || !auth.match(/^Basic /)) {
			throw new Error('No Basic Authorization.');
		}

		const base64 = auth.split(' ')[1];
		if (!base64) {
			throw new Error('Invalid data.');
		}

		const [user, password] = atob(base64).split(':');
		return { user: user, password: password };
	}

	public addUsers(users: { [keys: string]: string } | { user: string; password: string }[]) {
		if (Array.isArray(users)) {
			for (const info of users) {
				this.addUser(info.user, info.password);
			}
		} else {
			for (const user in users) {
				const password = users[user];
				this.addUser(user, password);
			}
		}
		return this;
	}

	public addUser(user: string, password: string) {
		this.users[user] = password;
		return this;
	}

	public removeAllUsers() {
		this.users = {};
		return this;
	}

	public removeUser(user: string) {
		delete this.users[user];
		return this;
	}
}
