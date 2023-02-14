/**
 * Static server.
 */

import * as Minirachne from 'https://raw.githubusercontent.com/Azulamb/minirachne/main/mod.ts';

const VERSIONS = `Minirachne: v${Minirachne.VERSION}
Use deno std: v${Minirachne.STD_VERSION}`;

const HELP = `Start local static server.
${VERSIONS}

USAGE:
    deno run --allow-read --allow-net --allow-env https://raw.githubusercontent.com/Azulamb/minirachne/main/server.ts [OPTIONS] [CONFIG_FILE]

OPTIONS:
    --help
        Print help information

    --url
        Set URL.
        Default: http://localhost/
        Env: MINIRACHNE_URL

    --docs
        Set document root.
        Default: docs/
        Env: MINIRACHNE_DOCUMENT_ROOT

CONFIG_FILE:
    Config file is JSON file.
{
    "url": "http://localhost/",
    "docs": "docs/"
}
`;

for (let i = 0; i < Deno.args.length; ++i) {
	switch (Deno.args[i]) {
		case '--help':
			console.log(HELP);
			Deno.exit(0);
		case '--version':
			console.log(VERSIONS);
			Deno.exit(0);
	}
}

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

const server = new Minirachne.Server();
if (config.url) {
	server.setURL(new URL(config.url));
}

const publicDocs = config.docs;
server.router.add('/*', new Minirachne.StaticRoute(publicDocs));
server.start();
