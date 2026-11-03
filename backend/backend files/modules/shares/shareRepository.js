const pool = require('../../config/database');
async function findRecipientByUsername(username) {
 const [rows] = await pool.execute('SELECT user_id, username, full_name, status FROM users WHERE username = ? LIMIT 1', [username]);
 return rows[0] || null;
}
async function findPublishedArticle(id) {
 const [rows] = await pool.execute("SELECT article_id, title FROM articles WHERE article_id = ? AND status = 'published' LIMIT 1", [id]);
 return rows[0] || null;
}
async function createShareAndNotification({ articleId, senderId, recipientId, message }) {
 const conn = await pool.getConnection();
 try {
  await conn.beginTransaction();
  const [share] = await conn.execute('INSERT INTO article_shares (article_id, sender_user_id, recipient_user_id) VALUES (?, ?, ?)', [articleId, senderId, recipientId]);
  const [result] = await conn.execute("INSERT INTO notifications (user_id, actor_user_id, type, message, article_id) VALUES (?, ?, 'article_share', ?, ?)", [recipientId, senderId, message, articleId]);
  const [[notification]] = await conn.execute('SELECT * FROM notifications WHERE notification_id = ?', [result.insertId]);
  await conn.commit();
  return { shareId: share.insertId, notification };
 } catch (error) { await conn.rollback(); throw error; }
 finally { conn.release(); }
}
async function listSharedWith(userId) {
 const [rows] = await pool.execute(`SELECT s.share_id, s.created_at AS shared_at,
  a.article_id, a.title, a.summary, a.created_at, u.username AS shared_by
  FROM article_shares s JOIN articles a ON a.article_id = s.article_id
  JOIN users u ON u.user_id = s.sender_user_id
  WHERE s.recipient_user_id = ? AND a.status = 'published'
  ORDER BY s.created_at DESC, s.share_id DESC LIMIT 100`, [userId]);
 return rows;
}
module.exports = { findRecipientByUsername, findPublishedArticle, createShareAndNotification, listSharedWith };
