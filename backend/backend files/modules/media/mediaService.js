const path = require('node:path');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const UPLOAD_DIR = path.resolve(__dirname, '../../uploads/article-media');
const TYPES = new Map([
  ['image/jpeg', { ext: '.jpg', kind: 'image', magic: b => b.length > 3 && b[0]===0xff && b[1]===0xd8 && b[2]===0xff }],
  ['image/png', { ext: '.png', kind: 'image', magic: b => b.subarray(0,8).equals(Buffer.from('89504e470d0a1a0a','hex')) }],
  ['image/gif', { ext: '.gif', kind: 'image', magic: b => b.subarray(0,4).toString()==='GIF8' }],
  ['image/webp', { ext: '.webp', kind: 'image', magic: b => b.subarray(0,4).toString()==='RIFF' && b.subarray(8,12).toString()==='WEBP' }],
  ['video/mp4', { ext: '.mp4', kind: 'video', magic: b => b.subarray(4,8).toString()==='ftyp' }],
  ['video/webm', { ext: '.webm', kind: 'video', magic: b => b.subarray(0,4).equals(Buffer.from('1a45dfa3','hex')) }],
]);
function inspect(buffer, mime) {
  const spec = TYPES.get(mime);
  return spec && spec.magic(buffer) ? spec : null;
}
function store(buffer, spec) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}${spec.ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buffer, { flag: 'wx' });
  return name;
}
module.exports = { UPLOAD_DIR, TYPES, inspect, store };
