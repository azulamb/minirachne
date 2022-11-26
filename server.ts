/**
 * Static server.
 *
 * USAGE:
 * deno run --allow-read --allow-net --allow-env https://raw.githubusercontent.com/Azulamb/minirachne/main/server.ts [OPTIONS] [CONFIG_FILE]
 *
 * OPTIONS:
 *   --url
 *     Set URL.
 *     Default: http://localhost/
 *     Env: MINIRACHNE_URL
 *
 *   --docs
 *     Set document root.
 *     Default: docs/
 *     Env: MINIRACHNE_DOCUMENT_ROOT
 *
 * CONFIG_FILE:
 *   Config file is JSON.
 *   {
 *     "url": "http://localhost/",
 *     "docs": "docs/"
 *   }
 */

const config: {
	url: string;
	docs: string;
} = {
	url: Deno.env.get('MINIRACHNE_URL') || 'http://localhost/',
	docs: Deno.env.get('MINIRACHNE_DOCUMENT_ROOT') || 'docs/',
};

for (let i = 0; i < Deno.args.length; ++i) {
	const arg = Deno.args[i];
	switch (arg) {
		case '--url':
		case '--docs': {
			const key = <'url'> arg.replace('--', '');
			const value = Deno.args[i + 1];
			if (value && !value.match(/^--[^-]*/)) {
				config[key] = value;
				++i;
			}
			continue;
		}
	}
	if (arg.match(/\.json$/)) {
		try {
			const json = JSON.parse(await Deno.readTextFile(arg));
			if (typeof json.url === 'string') {
				config.url = json.url;
			}
			if (typeof json.docs === 'string') {
				config.docs = json.docs;
			}
		} catch (error) {
			console.error(error);
		}
		break;
	}
}

import * as Minirachne from 'https://raw.githubusercontent.com/Azulamb/minirachne/main/mod.ts';

const server = new Minirachne.Server();
if (config.url) {
	server.setURL(new URL(config.url));
}
const publicDocs = Minirachne.createAbsolutePath(import.meta, config.docs);
server.router.add('/*', new Minirachne.StaticRoute(publicDocs));
server.run();
