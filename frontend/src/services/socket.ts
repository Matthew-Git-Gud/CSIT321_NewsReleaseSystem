import { io, type Socket } from 'socket.io-client';
import { API_BASE_URL } from './apiConfig';

const SOCKET_URL = API_BASE_URL;

let socket: Socket | null = null;

export function getNotificationSocket(): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      reconnection: true,
    });
  }
  return socket;
}

export function disconnectNotificationSocket() {
  socket?.disconnect();
}
