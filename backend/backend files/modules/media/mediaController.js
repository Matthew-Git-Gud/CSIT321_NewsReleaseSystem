const multer = require('multer');
const path = require('node:path');
const fs = require('node:fs');
const service = require('./mediaService');
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 1 }, fileFilter(req, file, cb) {
  cb(null, service.TYPES.has(file.mimetype));
}}).single('media');
function uploadMedia(req, res) {
  upload(req, res, error => {
    if (error) return res.status(400).json({ message: error.code === 'LIMIT_FILE_SIZE' ? 'Maximum upload size is 25 MB' : 'Invalid upload' });
    if (!req.file) return res.status(400).json({ message: 'Select a supported image or video' });
    const spec = service.inspect(req.file.buffer, req.file.mimetype);
    if (!spec) return res.status(400).json({ message: 'File content does not match the supported format' });
    try {
      const name = service.store(req.file.buffer, spec);
      // Absolute URL works when React and Express use different origins.
      return res.status(201).json({ type: spec.kind, url: `${req.protocol}://${req.get('host')}/api/media/${name}` });
    } catch (err) {
      console.error('Media upload error:', err);
      return res.status(500).json({ message: 'Unable to save media' });
    }
  });
}
function getMedia(req, res) {
  const name = req.params.filename;
  if (!/^[0-9a-f-]{36}\.(jpg|png|gif|webp|mp4|webm)$/.test(name)) return res.sendStatus(404);
  return res.sendFile(path.join(service.UPLOAD_DIR, name), { headers: { 'X-Content-Type-Options': 'nosniff', 'Cache-Control': 'public, max-age=86400' } }, err => {
    if (err && !res.headersSent) res.status(err.statusCode || 404).end();
  });
}
module.exports = { uploadMedia, getMedia };
