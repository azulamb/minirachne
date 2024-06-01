import * as asserts from '../_setup.ts';
import * as Minirachne from '../../mod.ts';

function ApiRouter() {
  const router = new Minirachne.Router();

  const subRouter = new Minirachne.Router();
  subRouter.post('/ok', () => {
    return Promise.resolve(new Response(''));
  });

  subRouter.add('/*', () => {
    return Promise.reject(Minirachne.HTTPErrors.server.InternalServerError().setPropagation(false));
  });

  router.addRouter('/sub', subRouter);

  router.add('/*', () => {
    return Promise.reject(Minirachne.HTTPErrors.client.BadRequest().setPropagation(false));
  });

  return router;
}

Deno.test('Multistage router', async () => {
  const url = new URL('http://localhost:18080/');

  const server = new Minirachne.Server();
  server.setURL(url);

  server.router.addRouter('/api', ApiRouter());

  const p = server.start();

  await fetch(new URL('/api/test', url)).then((response) => {
    asserts.assertEquals(response.status, 400);
    return response.text();
  });

  await fetch(new URL('/api/sub/test', url)).then((response) => {
    asserts.assertEquals(response.status, 500);
    return response.text();
  });

  await fetch(new URL('/api/sub/ok', url), { method: 'POST' }).then((response) => {
    asserts.assertEquals(response.status, 200);
    return response.text();
  });

  server.stop();
  await p;
});
