import * as asserts from '../_setup.ts';
import { Server } from '../../src/server.ts';

Deno.test('Server settings', () => {
  const server = new Server();

  const url = new URL('http://localhost:8080/');

  server.setURL(url);
  asserts.assertEquals(server.getURL(), url);
});
