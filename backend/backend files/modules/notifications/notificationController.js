const service = require('./notificationService');
const respondError = (res, error) => { console.error('Notification API error:', error); return res.status(500).json({ message: 'Unable to process notifications' }); };
async function list(req, res) { try { return res.json({ notifications: await service.list(req.user.user_id) }); } catch (e) { return respondError(res, e); } }
async function unreadCount(req, res) { try { return res.json({ unreadCount: await service.countUnread(req.user.user_id) }); } catch (e) { return respondError(res, e); } }
async function markRead(req, res) {
 const id = Number(req.params.id);
 if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ message: 'Invalid notification ID' });
 try { const found = await service.markRead(req.user.user_id, id); return found ? res.json({ success: true }) : res.status(404).json({ message: 'Notification not found' }); } catch (e) { return respondError(res, e); }
}
async function markAllRead(req, res) { try { return res.json({ updated: await service.markAllRead(req.user.user_id) }); } catch (e) { return respondError(res, e); } }
module.exports = { list, unreadCount, markRead, markAllRead };
