/**
deno run --allow-run tools/settag.ts
*/

import { VERSION } from '../version.ts';
await Deno.run({
	cmd: ['git', 'tag', `v${VERSION}`],
}).output();
