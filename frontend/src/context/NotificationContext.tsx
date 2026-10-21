import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getNotificationSocket } from '../services/socket';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type Notification,
} from '../services/notifications';

type ContextValue = {
  connected: boolean;
  notifications: Notification[];
  unreadCount: number;
  latestIncoming: Notification | null;
  dismissIncoming: () => void;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
};

const Context = createContext<ContextValue | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const [connected, setConnected] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [latestIncoming, setLatestIncoming] = useState<Notification | null>(null);

  useEffect(() => {
    const socket = getNotificationSocket();
    if (loading || !user) {
      socket.disconnect();
      setConnected(false);
      setNotifications([]);
      setLatestIncoming(null);
      return;
    }

    let active = true;
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    const onNotification = (notification: Notification) => {
      if (!active) return;
      setNotifications(previous => [
        notification,
        ...previous.filter(item => item.notification_id !== notification.notification_id),
      ]);
      setLatestIncoming(notification);
    };
    const onError = (error: Error) => console.error('Socket authentication failed:', error.message);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('notification:new', onNotification);
    socket.on('connect_error', onError);
    socket.connect();
    setConnected(socket.connected);

    getNotifications()
      .then(data => {
        if (!active) return;
        setNotifications(previous => {
          const byId = new Map<number, Notification>();
          for (const item of data.notifications) byId.set(item.notification_id, item);
          for (const item of previous) byId.set(item.notification_id, item);
          return [...byId.values()].sort((a, b) => b.notification_id - a.notification_id);
        });
      })
      .catch(error => console.error('Loading notifications failed:', error));

    return () => {
      active = false;
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('notification:new', onNotification);
      socket.off('connect_error', onError);
      socket.disconnect();
    };
  }, [loading, user?.user_id]);

  useEffect(() => {
    if (!latestIncoming) return;
    const timeout = window.setTimeout(() => setLatestIncoming(null), 5500);
    return () => window.clearTimeout(timeout);
  }, [latestIncoming]);

  const markRead = async (id: number) => {
    await markNotificationRead(id);
    setNotifications(previous => previous.map(item =>
      item.notification_id === id ? { ...item, is_read: 1 } : item
    ));
  };

  const markAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications(previous => previous.map(item => ({ ...item, is_read: 1 })));
  };

  return (
    <Context.Provider value={{
      connected,
      notifications,
      unreadCount: notifications.filter(item => !item.is_read).length,
      latestIncoming,
      dismissIncoming: () => setLatestIncoming(null),
      markRead,
      markAllRead,
    }}>
      {children}
    </Context.Provider>
  );
}

export function useNotifications() {
  const value = useContext(Context);
  if (!value) throw new Error('useNotifications must be used within NotificationProvider');
  return value;
}
