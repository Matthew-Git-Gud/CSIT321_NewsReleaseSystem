const service = require('./newsService');
async function listExternalNews(req, res) {
  try { res.json(await service.list(req.query)); }
  catch (error) { res.status(error.status || 500).json({ message: error.status ? error.message : 'Unable to load external news' }); }
}
module.exports = { listExternalNews };
