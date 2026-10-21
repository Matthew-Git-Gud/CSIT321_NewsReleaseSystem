const repository = require('./notificationRepository');
const { emitToUser } = require('../../config/socket');
const list = userId => repository.list(userId);
const countUnread = userId => repository.countUnread(userId);
const markRead = (userId, id) => repository.markRead(userId, id);
const markAllRead = userId => repository.markAllRead(userId);
async function createNotification({ userId, actorUserId = null, type, message, articleId = null }) {
 if (!Number.isSafeInteger(Number(userId)) || Number(userId) <= 0) throw new Error('Invalid recipient');
 if (typeof type !== 'string' || !type || type.length > 40 || typeof message !== 'string' || !message || message.length > 500) throw new Error('Invalid notification');
 const notification = await repository.create({ userId, actorUserId, type, message, articleId });
 try { emitToUser(userId, 'notification:new', notification); }
 catch (error) { console.error('Realtime delivery unavailable; notification saved:', error.message); }
 return notification;
}
module.exports = { list, countUnread, markRead, markAllRead, createNotification };
