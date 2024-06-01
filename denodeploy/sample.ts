import * as Minirachne from 'https://raw.githubusercontent.com/Azulamb/minirachne/main/mod.ts';

console.log(`Minirachne ver: ${Minirachne.VERSION}`);
console.log(Deno.env.toObject());

const server = new Minirachne.Server();

/* You can use member variable in Route, if normal function.
server.router.add('/*', function(data) {
	console.log(data.pattern); // OK.
});
server.router.add('/*', (data) => {
	console.log(data.pattern); // Error. this = undefined.
});
*/
server.router.add('/*', (data) => {
  console.log(data.request.url);
  const body = JSON.stringify({
    framework: Minirachne.NAME,
    version: Minirachne.VERSION,
    std: Minirachne.STD_VERSION,
  });
  const headers = new Headers();
  headers.set('content-type', 'application/json');
  headers.set('content-length', encodeURI(body).replace(/%../g, '*').length + '');
  const response = new Response(body, { headers: headers });
  return Promise.resolve(response);
});

console.log(`Start: ${server.getURL()}`);
await server.start();
