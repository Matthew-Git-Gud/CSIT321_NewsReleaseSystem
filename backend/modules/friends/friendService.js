const repo = require('./friendRepository');
const { emitToUser } = require('../../config/socket');
class FriendError extends Error { constructor(status, message) { super(message); this.status = status; } }
const positiveId = value => { const n = Number(value); if (!Number.isSafeInteger(n) || n < 1) throw new FriendError(400, 'Invalid user or friendship ID'); return n; };
function notify(userId, notification) {
  try { emitToUser(userId, 'notification:new', notification); }
  catch (error) { console.error('Friend notification saved; realtime delivery unavailable:', error.message); }
}
async function searchUsers(userId, rawQuery) {
  const q = typeof rawQuery === 'string' ? rawQuery.trim() : '';
  if (q.length < 2 || q.length > 50) throw new FriendError(400, 'Search must contain 2 to 50 characters');
  return { users: await repo.searchUsers(userId, q.replace(/[\%_]/g, '\\$&')) };
}
async function sendRequest(senderId, rawRecipientId) {
  const recipientId = positiveId(rawRecipientId);
  if (senderId === recipientId) throw new FriendError(400, 'Cannot add yourself');
  const recipient = await repo.validUser(recipientId);
  if (!recipient) throw new FriendError(404, 'Available user not found');
  const result = await repo.withPairLock(senderId, recipientId, async conn => {
    const existing = await repo.findPair(conn, senderId, recipientId);
    if (existing && existing.status !== 'rejected') throw new FriendError(409, 'Friendship or request already exists');
    if (existing) {
      await conn.execute("UPDATE friendships SET requester_id = ?, addressee_id = ?, status = 'pending', created_at = CURRENT_TIMESTAMP WHERE friendship_id = ?", [senderId, recipientId, existing.friendship_id]);
    } else {
      await conn.execute("INSERT INTO friendships (requester_id, addressee_id, status) VALUES (?, ?, 'pending')", [senderId, recipientId]);
    }
    const notification = await repo.createNotification(conn, { recipientId, actorId: senderId, type: 'friend_request', message: 'You received a friend request' });
    return { notification, friendshipId: existing?.friendship_id || null };
  });
  notify(recipientId, result.notification);
  return { message: 'Friend request sent' };
}
async function act(userId, rawFriendshipId, action) {
  const friendshipId = positiveId(rawFriendshipId);
  const snapshot = await repo.findById(friendshipId);
  if (!snapshot || (snapshot.requester_id !== userId && snapshot.addressee_id !== userId)) throw new FriendError(404, 'Friendship not found');
  const otherId = snapshot.requester_id === userId ? snapshot.addressee_id : snapshot.requester_id;
  const result = await repo.withPairLock(userId, otherId, async conn => {
    const [[row]] = await conn.execute('SELECT * FROM friendships WHERE friendship_id = ? FOR UPDATE', [friendshipId]);
    if (!row || ![row.requester_id,row.addressee_id].includes(userId)) throw new FriendError(404, 'Friendship not found');
    if (action === 'accept' || action === 'reject') {
      if (row.addressee_id !== userId || row.status !== 'pending') throw new FriendError(409, 'Only the recipient can respond to a pending request');
      await conn.execute('UPDATE friendships SET status = ? WHERE friendship_id = ?', [action === 'accept' ? 'accepted' : 'rejected', friendshipId]);
      if (action === 'accept') {
        const notification = await repo.createNotification(conn, { recipientId: row.requester_id, actorId: userId, type: 'friend_accepted', message: 'Your friend request was accepted' });
        return { notification, recipientId: row.requester_id };
      }
    } else if (action === 'cancel') {
      if (row.requester_id !== userId || row.status !== 'pending') throw new FriendError(409, 'Only the sender can cancel a pending request');
      await conn.execute('DELETE FROM friendships WHERE friendship_id = ?', [friendshipId]);
    } else if (action === 'remove') {
      if (row.status !== 'accepted') throw new FriendError(409, 'Only accepted friends can be removed');
      await conn.execute('DELETE FROM friendships WHERE friendship_id = ?', [friendshipId]);
    }
    return {};
  });
  if (result.notification) notify(result.recipientId, result.notification);
  return { message: `Friend request ${action === 'accept' ? 'accepted' : action === 'reject' ? 'rejected' : action === 'cancel' ? 'cancelled' : 'removed'}` };
}
module.exports = { FriendError, searchUsers, sendRequest, listFriends: async id => ({ friends: await repo.listFriends(id) }), listRequests: id => repo.listRequests(id), act };
