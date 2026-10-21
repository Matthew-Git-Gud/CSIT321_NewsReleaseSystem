const pool = require('../../config/database');
async function list(userId, limit = 50) {
 const [rows] = await pool.query('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC, notification_id DESC LIMIT ?', [userId, limit]);
 return rows;
}
async function countUnread(userId) {
 const [[row]] = await pool.query('SELECT COUNT(*) AS unreadCount FROM notifications WHERE user_id = ? AND is_read = 0', [userId]);
 return Number(row.unreadCount);
}
async function markRead(userId, id) {
 const [result] = await pool.query('UPDATE notifications SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE notification_id = ? AND user_id = ?', [id, userId]);
 return result.affectedRows > 0;
}
async function markAllRead(userId) {
 const [result] = await pool.query('UPDATE notifications SET is_read = 1, read_at = COALESCE(read_at, CURRENT_TIMESTAMP) WHERE user_id = ? AND is_read = 0', [userId]);
 return result.affectedRows;
}
async function create({ userId, actorUserId = null, type, message, articleId = null }) {
 const [result] = await pool.query('INSERT INTO notifications (user_id, actor_user_id, type, message, article_id) VALUES (?, ?, ?, ?, ?)', [userId, actorUserId, type, message, articleId]);
 const [[row]] = await pool.query('SELECT * FROM notifications WHERE notification_id = ?', [result.insertId]);
 return row;
}
module.exports = { list, countUnread, markRead, markAllRead, create };
