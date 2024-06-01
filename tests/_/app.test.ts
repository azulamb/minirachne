import * as asserts from '../_setup.ts';

Deno.test('Permission test', async () => {
  asserts.assertThrows(
    () => {
      Deno.statSync('notfound');
    },
    Deno.errors.NotFound,
    undefined,
    `
\x1b[91m==============================
      PERMISSION ERROR!!
 Please run \`deno task tests\`
==============================\x1b[0m`,
  );
});
