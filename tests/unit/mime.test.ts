import * as asserts from '../_setup.ts';
import { MIMETypes } from '../../src/mime.ts';

Deno.test('MimeTypes', () => {
	const mimeTypes = new MIMETypes();
	asserts.assertEquals(mimeTypes.get('json'), 'application/json');
	mimeTypes.set({
		json: 'text/json',
	});
	asserts.assertEquals(mimeTypes.get('json'), 'text/json');
	asserts.assertEquals(mimeTypes.getFromPath('dir/index.html'), 'text/html');
	asserts.assertEquals(mimeTypes.get('torrent'), '');
});
