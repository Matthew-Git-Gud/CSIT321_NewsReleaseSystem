const service = require('./shareService');
function sendError(res, error) {
 if (error.status) return res.status(error.status).json({ message: error.message });
 console.error('Share API error:', error);
 return res.status(500).json({ message: 'Unable to process sharing request' });
}
async function shareArticle(req, res) {
 try { res.status(201).json(await service.shareArticle(req.params.id, req.user.user_id, req.body?.recipientUsername)); }
 catch (error) { sendError(res, error); }
}
async function sharedWithMe(req, res) {
 try { res.json(await service.sharedWithMe(req.user.user_id)); }
 catch (error) { sendError(res, error); }
}
module.exports = { shareArticle, sharedWithMe };
