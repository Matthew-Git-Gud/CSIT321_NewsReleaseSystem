import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import '../styles/NotificationBell.css';
export default function NotificationBell() {
 const { notifications, unreadCount, markRead, markAllRead } = useNotifications();
 const [open, setOpen] = useState(false);
 return <div className="notification-bell">
  <button type="button" className="notification-bell__button" aria-label={`Notifications, ${unreadCount} unread`} aria-expanded={open} onClick={() => setOpen(v => !v)}>🔔 {unreadCount > 0 && <span className="notification-bell__count">{unreadCount}</span>}</button>
  {open && <div className="notification-bell__panel" role="region" aria-label="Notifications">
   <div className="notification-bell__header"><strong>Notifications</strong><button type="button" onClick={() => void markAllRead().catch(console.error)}>Mark all read</button></div>
   {notifications.length === 0 ? <p>No notifications yet.</p> : <ul>{notifications.map(n => <li key={n.notification_id} className={n.is_read ? '' : 'notification-bell__unread'}>
    {n.article_id ? <Link to={`/articles/${n.article_id}`} onClick={() => { setOpen(false); void markRead(n.notification_id).catch(console.error); }}>{n.message}</Link> : <button type="button" onClick={() => void markRead(n.notification_id).catch(console.error)}>{n.message}</button>}
    <small>{new Date(n.created_at).toLocaleString()}</small>
   </li>)}</ul>}
  </div>}
 </div>;
}
