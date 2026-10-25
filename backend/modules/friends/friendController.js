const service = require('./friendService');
function handle(res, error) {
  if (error.status) return res.status(error.status).json({ message: error.message });
  console.error('Friends API error:', error);
  return res.status(500).json({ message: 'Unable to process friendship request' });
}
const endpoint = (fn, status = 200) => async (req, res) => {
  try { return res.status(status).json(await fn(req)); }
  catch (error) { return handle(res, error); }
};
module.exports = {
  searchUsers: endpoint(req => service.searchUsers(req.user.user_id, req.query.q)),
  listFriends: endpoint(req => service.listFriends(req.user.user_id)),
  listRequests: endpoint(req => service.listRequests(req.user.user_id)),
  sendRequest: endpoint(req => service.sendRequest(req.user.user_id, req.body?.recipientId), 201),
  acceptRequest: endpoint(req => service.act(req.user.user_id, req.params.id, 'accept')),
  rejectRequest: endpoint(req => service.act(req.user.user_id, req.params.id, 'reject')),
  cancelRequest: endpoint(req => service.act(req.user.user_id, req.params.id, 'cancel')),
  removeFriend: endpoint(req => service.act(req.user.user_id, req.params.id, 'remove')),
};
