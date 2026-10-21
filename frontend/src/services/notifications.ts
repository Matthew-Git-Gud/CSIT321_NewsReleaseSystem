export type Notification = {
 notification_id: number;
 user_id: number;
 actor_user_id: number | null;
 type: string;
 message: string;
 article_id: number | null;
 is_read: number | boolean;
 created_at: string;
 read_at: string | null;
};
const BASE = 'http://localhost:3000/api/notifications';
async function request<T>(path: string, options?: RequestInit): Promise<T> {
 const response = await fetch(`${BASE}${path}`, { credentials: 'include', ...options });
 if (!response.ok) throw new Error(`Notification API failed: ${response.status}`);
 return response.json() as Promise<T>;
}
export const getNotifications = () => request<{ notifications: Notification[] }>('/');
export const getUnreadCount = () => request<{ unreadCount: number }>('/unread-count');
export const markNotificationRead = (id: number) => request<{ success: boolean }>(`/${id}/read`, { method: 'PATCH' });
export const markAllNotificationsRead = () => request<{ updated: number }>('/read-all', { method: 'PATCH' });
