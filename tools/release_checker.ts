/**
deno run --allow-run --allow-net tools/release_checker.ts
*/

import { VERSION } from '../version.ts';
import DENO_JSON from '../deno.json' with { type: 'json' };
const STD_VERSION = DENO_JSON.imports['$minirachne_std/'].replace(/^.+std@([0-9.]+).+$/, '$1');

async function Exec(command: string[]) {
	const { stdout, stderr } = await new Deno.Command(
		command.shift() as string,
		{
			args: command,
		},
	).output();

	return {
		stdout: new TextDecoder().decode(stdout),
		stderr: new TextDecoder().decode(stderr),
	};
}

function Exit(message: string) {
	console.error(`\x1b[91mError: ${message}\x1b[0m`);
	Deno.exit(1);
}

function Start(name: string) {
	console.log(`== ${name} `.padEnd(80, '='));
}

function Complete(message: string) {
	console.log(`\x1b[92m${message}\x1b[0m`);
}

function OfficialStdVersion() {
	return fetch('https://deno.land/std', { headers: { accept: 'text/html' }, redirect: 'manual' }).then((response) => {
		const status = response.status;
		if (status < 300 || 400 <= status) {
			throw new Error(`Access error: ${status}`);
		}
		const location = response.headers.get('location') || '';
		const version = location.split('@')[1];
		if (!version) {
			throw new Error(`Get version error:`);
		}
		return version;
	});
}

function ImportFiles(result: string) {
	// deno-lint-ignore no-control-regex
	return result.replace(/\x1b\[[0-9\;]+m/g, '')
		.replace(/(\r\n|\r)/g, '\n')
		.split(/\n\n/)[1].split(/\n/).map((line) => {
			return line.replace(/^[ └│├─┬]+/, '').split(' ')[0];
		});
}

function ImportLocalFiles(result: string) {
	return ImportFiles(result).filter((path) => {
		return path && !path.match(/^https\:/) && path !== 'Relative';
	});
}

function VersionCheck(nowTag: string, noeVer: string) {
	const v1 = nowTag.split('.').map((v) => {
		return parseInt(v);
	});
	const v2 = noeVer.split('.').map((v) => {
		return parseInt(v);
	});
	for (let i = 0; i < 3; ++i) {
		if (v1[i] < v2[i]) {
			return true;
		}
	}
	return false;
}

const list: { name: string; command?: string[]; after: (result: { stdout: string; stderr: string }) => Promise<string | void> }[] = [
	{
		name: 'Sample import check (server)',
		command: ['deno', 'info', 'sample/server.ts'],
		after: (result) => {
			return Promise.resolve(ImportLocalFiles(result.stdout)).then((imports) => {
				if (1 < imports.length) {
					throw new Error('Sample import local file.');
				}
			});
		},
	},
	{
		name: 'Sample import check (Deno Deploy)',
		command: ['deno', 'info', 'denodeploy/sample.ts'],
		after: (result) => {
			return Promise.resolve(ImportLocalFiles(result.stdout)).then((imports) => {
				if (1 < imports.length) {
					throw new Error('Sample import local file.');
				}
			});
		},
	},
	{
		name: 'Deno.std check(libs)',
		command: ['deno', 'info', 'src/deno_std.ts'],
		after: (result) => {
			return Promise.resolve(ImportFiles(result.stdout)).then((files) => {
				if (files.length <= 0) {
					throw new Error('libs std version error.');
				}
				for (const file of files) {
					if (!file.match(/^https:/)) {
						continue;
					}
					const version = file.replace(/^.+@([0-9.]+).+$/, '$1');
					if (version !== STD_VERSION) {
						throw new Error('libs std version error.');
					}
				}
			});
		},
	},
	{
		name: 'Deno.std check(test)',
		command: ['deno', 'info', 'tests/_setup.ts'],
		after: (result) => {
			return Promise.resolve(ImportFiles(result.stdout)).then((files) => {
				if (files.length <= 0) {
					throw new Error('test std version error.');
				}
				for (const file of files) {
					if (!file.match(/^https:/)) {
						continue;
					}
					const version = file.replace(/^.+@([0-9.]+).+$/, '$1');
					if (version !== STD_VERSION) {
						throw new Error('test std version error.');
					}
				}
			});
		},
	},
	{
		name: 'Official Deno.std version check',
		after: () => {
			return OfficialStdVersion().then((version) => {
				if (version !== STD_VERSION) {
					throw new Error(`Use old std! (${STD_VERSION} => ${version})`);
				}
				return `Use std is latest. (v${version})`;
			});
		},
	},
	{
		name: 'Deno version check',
		command: ['deno', 'upgrade', '--dry-run'],
		after: (result) => {
			const version = result.stderr.replace(/^Local deno version ([0-9.]+).+$/s, '$1');
			if (version.match(/[^0-9.]/)) {
				return Promise.resolve('This deno version is latest');
			}
			return Promise.reject(new Error(`Found latest version: ${version}\nExec \`deno upgrade\``));
		},
	},
	{
		name: 'VERSION check',
		command: ['git', 'describe', '--tags', '--abbrev=0'],
		after: (result) => {
			return Promise.resolve(result.stdout.replace(/\s/g, '')).then((tag) => {
				console.log(`Now tag: ${tag} Now ver: ${VERSION}`);
				if (!VersionCheck(tag, VERSION)) {
					throw new Error('VERSION not updated.');
				}
			});
		},
	},
];

for (const check of list) {
	Start(check.name);
	const p = check.command ? Exec(check.command).then(check.after) : check.after({ stdout: '', stderr: '' });
	await p.then((msg) => {
		Complete(`OK ... ${check.name}${msg ? ': ' + msg : ''}`);
	}).catch((error) => {
		Exit(error.message);
	});
}

console.log(''.padEnd(80, '-'));
Complete(`Complete!!`);
