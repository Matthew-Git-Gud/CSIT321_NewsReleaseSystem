export type FriendUser = { user_id: number; username: string; full_name: string | null; friendship_id: number };
const BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api').replace(/\/$/, '');
export async function getFriends(): Promise<FriendUser[]> {
  const response = await fetch(`${BASE}/friends`, { credentials: 'include' });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || 'Unable to load friends');
  return Array.isArray(data?.friends) ? data.friends : [];
}
