const test = require('node:test');
const assert = require('node:assert/strict');
const service = require('../modules/media/mediaService');
test('rejects invalid file signatures', () => assert.equal(service.inspect(Buffer.from('not an image'), 'image/png'), null));
test('recognises PNG signature', () => {
  const b = Buffer.from('89504e470d0a1a0a', 'hex');
  assert.equal(service.inspect(b, 'image/png').kind, 'image');
});
test('rejects unsupported MIME types', () => assert.equal(service.inspect(Buffer.from('anything'), 'image/svg+xml'), null));
