const pool = require('../../config/database');

const getConnection = () => pool.getConnection();
const validUser = async (id) => {
  const [[user]] = await pool.execute("SELECT user_id, username, full_name FROM users WHERE user_id = ? AND status = 'active' LIMIT 1", [id]);
  return user || null;
};
async function searchUsers(userId, q) {
  const [rows] = await pool.execute(`SELECT u.user_id, u.username, u.full_name,
    f.friendship_id, f.status AS friendship_status, f.requester_id
    FROM users u LEFT JOIN friendships f ON
      ((f.requester_id = ? AND f.addressee_id = u.user_id) OR
       (f.addressee_id = ? AND f.requester_id = u.user_id))
    WHERE u.user_id <> ? AND u.status = 'active'
      AND (u.username LIKE ? OR u.full_name LIKE ?)
    ORDER BY u.username LIMIT 30`, [userId, userId, userId, `%${q}%`, `%${q}%`]);
  return rows;
}
async function listFriends(userId) {
  const [rows] = await pool.execute(`SELECT f.friendship_id, f.updated_at AS friends_since,
    u.user_id, u.username, u.full_name FROM friendships f
    JOIN users u ON u.user_id = IF(f.requester_id = ?, f.addressee_id, f.requester_id)
    WHERE (f.requester_id = ? OR f.addressee_id = ?) AND f.status = 'accepted'
      AND u.status = 'active' ORDER BY u.username`, [userId, userId, userId]);
  return rows;
}
async function listRequests(userId) {
  const [rows] = await pool.execute(`SELECT f.friendship_id, f.requester_id, f.addressee_id,
    f.created_at, f.status, u.user_id, u.username, u.full_name
    FROM friendships f JOIN users u ON u.user_id = IF(f.requester_id = ?, f.addressee_id, f.requester_id)
    WHERE (f.requester_id = ? OR f.addressee_id = ?) AND f.status = 'pending'
    ORDER BY f.created_at DESC`, [userId, userId, userId]);
  return { incoming: rows.filter(r => r.addressee_id === userId), outgoing: rows.filter(r => r.requester_id === userId) };
}
async function lockPair(conn, a, b) {
  const key = `friends:${Math.min(a,b)}:${Math.max(a,b)}`;
  const [[result]] = await conn.execute('SELECT GET_LOCK(?, 10) AS acquired', [key]);
  if (result.acquired !== 1) throw Object.assign(new Error('Friendship is busy, retry'), { status: 503 });
  return key;
}
async function withPairLock(a, b, operation) {
  const conn = await getConnection();
  let key;
  try {
    key = await lockPair(conn, a, b);
    await conn.beginTransaction();
    const value = await operation(conn);
    await conn.commit();
    return value;
  } catch (err) {
    try { await conn.rollback(); } catch (_) {}
    throw err;
  } finally {
    if (key) { try { await conn.execute('SELECT RELEASE_LOCK(?)', [key]); } catch (err) { console.error('Failed to release friendship lock:', err); } }
    conn.release();
  }
}
async function findPair(conn, a, b) {
  const [[row]] = await conn.execute(`SELECT * FROM friendships
    WHERE (requester_id = ? AND addressee_id = ?) OR (requester_id = ? AND addressee_id = ?)
    LIMIT 1 FOR UPDATE`, [a,b,b,a]);
  return row || null;
}
async function findById(id) {
  const [[row]] = await pool.execute('SELECT * FROM friendships WHERE friendship_id = ?', [id]);
  return row || null;
}
async function createNotification(conn, { recipientId, actorId, type, message }) {
  const [result] = await conn.execute('INSERT INTO notifications (user_id, actor_user_id, type, message, article_id) VALUES (?, ?, ?, ?, NULL)', [recipientId, actorId, type, message]);
  const [[row]] = await conn.execute('SELECT * FROM notifications WHERE notification_id = ?', [result.insertId]);
  return row;
}
module.exports = { validUser, searchUsers, listFriends, listRequests, withPairLock, findPair, findById, createNotification };
