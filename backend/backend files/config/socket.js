const { Server } = require('socket.io');
const socketAuth = require('../middleware/socketAuth');
let io;

function initializeSocketServer(httpServer, origin = 'http://localhost:5173') {
  if (io) throw new Error('Socket.IO already initialized');
  io = new Server(httpServer, {
    cors: { origin, credentials: true },
  });
  io.use(socketAuth);
  io.on('connection', (socket) => {
    const room = `user:${socket.data.user.user_id}`;
    socket.join(room);
    console.log(`Socket connected for user ${socket.data.user.user_id}`);
    socket.on('disconnect', () => {
      console.log(`Socket disconnected for user ${socket.data.user.user_id}`);
    });
  });
  return io;
}

function emitToUser(userId, event, payload) {
  if (!io) throw new Error('Socket.IO is not initialized');
  io.to(`user:${userId}`).emit(event, payload);
}
module.exports = { initializeSocketServer, emitToUser };
