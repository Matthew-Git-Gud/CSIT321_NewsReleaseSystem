const repo = require('./shareRepository');
const { emitToUser } = require('../../config/socket');
class ShareError extends Error { constructor(status, message) { super(message); this.status = status; } }
async function shareArticle(rawArticleId, senderId, rawUsername) {
 const articleId = Number(rawArticleId);
 if (!Number.isSafeInteger(articleId) || articleId <= 0) throw new ShareError(400, 'Invalid article ID');
 const username = typeof rawUsername === 'string' ? rawUsername.trim() : '';
 if (!username || username.length > 100) throw new ShareError(400, 'Valid recipient username required');
 const [article, recipient] = await Promise.all([
  repo.findPublishedArticle(articleId), repo.findRecipientByUsername(username)
 ]);
 if (!article) throw new ShareError(404, 'Published article not found');
 if (!recipient || recipient.status === 'suspended') throw new ShareError(404, 'Available recipient not found');
 if (Number(recipient.user_id) === Number(senderId)) throw new ShareError(400, 'You cannot share an article with yourself');
 const message = `An article was shared with you: ${article.title}`.slice(0, 500);
 const result = await repo.createShareAndNotification({ articleId, senderId, recipientId: recipient.user_id, message });
 try { emitToUser(recipient.user_id, 'notification:new', result.notification); }
 catch (error) { console.error('Notification saved; live delivery unavailable:', error.message); }
 return { message: 'Article shared successfully', shareId: result.shareId };
}
async function sharedWithMe(userId) { return { articles: await repo.listSharedWith(userId) }; }
module.exports = { ShareError, shareArticle, sharedWithMe };
