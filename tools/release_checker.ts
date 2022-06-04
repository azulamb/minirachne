/**
deno run --allow-run --allow-net tools/release_checker.ts
*/

import { VERSION } from '../version.ts';
import { VERSION as STD_VERSION } from '../src/denostd.ts';

function Exec(command: string[]) {
	const process = Deno.run({
		cmd: command,
		stdout: 'piped',
		//stderr: "piped",
	});
	return process.output().then((result) => {
		return new TextDecoder().decode(result);
	});
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
		return path && !path.match(/^https\:/);
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

const list: { name: string; command?: string[]; after: (result: string) => Promise<string | void> }[] = [
	{
		name: 'Sample import check (server)',
		command: ['deno', 'info', 'sample/server.ts'],
		after: (result) => {
			return Promise.resolve(ImportLocalFiles(result)).then((imports) => {
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
			return Promise.resolve(ImportLocalFiles(result)).then((imports) => {
				if (1 < imports.length) {
					throw new Error('Sample import local file.');
				}
			});
		},
	},
	{
		name: 'Deno.std check(libs)',
		command: ['deno', 'info', 'src/denostd.ts'],
		after: (result) => {
			return Promise.resolve(ImportFiles(result)).then((files) => {
				if (files.length <= 0) {
					throw new Error('std version error.');
				}
				for (const file of files) {
					if (!file.match(/^https:/)) {
						continue;
					}
					const version = file.replace(/^.+@([0-9.]+).+$/, '$1');
					if (version !== STD_VERSION) {
						throw new Error('std version error.');
					}
				}
			});
		},
	},
	{
		name: 'Deno.std check(test)',
		command: ['deno', 'info', 'tests/_setup.ts'],
		after: (result) => {
			return Promise.resolve(ImportFiles(result)).then((files) => {
				if (files.length <= 0) {
					throw new Error('std version error.');
				}
				for (const file of files) {
					if (!file.match(/^https:/)) {
						continue;
					}
					const version = file.replace(/^.+@([0-9.]+).+$/, '$1');
					if (version !== STD_VERSION) {
						throw new Error('std version error.');
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
			const version = result.replace(/^.+Found latest version ([0-9.]+).+$/s, '$1');
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
			return Promise.resolve(result.replace(/\s/g, '')).then((tag) => {
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
	const p = check.command ? Exec(check.command).then(check.after) : check.after('');
	await p.then((msg) => {
		Complete(`OK ... ${check.name}${msg ? ': ' + msg : ''}`);
	}).catch((error) => {
		Exit(error.message);
	});
}

console.log(''.padEnd(80, '-'));
Complete(`Complete!!`);
