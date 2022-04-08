/**
deno run --allow-run tools/release_checker.ts
*/

import { VERSION } from '../version.ts';

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

function ImportLocalFiles(result: string){
	// deno-lint-ignore no-control-regex
	return result.replace(/\x1b\[[0-9\;]+m/g, '')
	.replace(/(\r\n|\r)/g, '\n')
	.split(/\n\n/)[1].split(/\n/).map((line) => {
		return line.replace(/^[ └│├─┬]+/, '').split(' ')[0];
	}).filter((path) => {
		return path && !path.match(/^https\:/);
	})
}

const list: { name: string; command: string[]; after: (result: string) => Promise<void> }[] = [
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
		name: 'VERSION check',
		command: ['git', 'describe', '--tags', '--abbrev=0'],
		after: (result) => {
			return Promise.resolve(result.replace(/\s/g, '')).then((tag) => {
				console.log(`Now tag: ${tag}`);
				if (tag === `v${VERSION}`) {
					throw new Error('VERSION not updated.');
				}
			});
		},
	},
];

for (const check of list) {
	Start(check.name);
	await Exec(check.command)
		.then(check.after).then(() => {
			Complete(`OK ... ${check.name}`);
		}).catch((error) => {
			Exit(error.message);
		});
}
console.log(''.padEnd(80, '-'));
Complete(`Complete!!`);
