import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import '../styles/NotificationBell.css';
export default function NotificationBell() {
 const { connected, notifications, unreadCount, markRead, markAllRead } = useNotifications();
 const [open, setOpen] = useState(false);
 return <div className="notification-bell">
  <button type="button" className="notification-bell__button" aria-label={`Notifications, ${unreadCount} unread`} aria-expanded={open} onClick={() => setOpen(v => !v)}>
   <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 22h4" /></svg>
   {unreadCount > 0 && <span className="notification-bell__count">{unreadCount > 9 ? '9+' : unreadCount}</span>}
  </button>
  {open && <div className="notification-bell__panel" role="region" aria-label="Notifications">
   <div className="notification-bell__header"><div><span>{connected ? 'Live updates on' : 'Notifications'}</span><strong>Inbox</strong></div><button type="button" disabled={unreadCount === 0} onClick={() => void markAllRead().catch(console.error)}>Mark all read</button></div>
   {notifications.length === 0 ? <div className="notification-bell__empty"><span aria-hidden="true">✦</span><p>No notifications yet.</p></div> : <ul>{notifications.map(n => <li key={n.notification_id} className={n.is_read ? '' : 'notification-bell__unread'}>
    {n.article_id ? <Link to={`/articles/${n.article_id}`} onClick={() => { setOpen(false); void markRead(n.notification_id).catch(console.error); }}>{n.message}</Link> : <button type="button" onClick={() => void markRead(n.notification_id).catch(console.error)}>{n.message}</button>}
    <small>{new Date(n.created_at).toLocaleString()}</small>
   </li>)}</ul>}
  </div>}
 </div>;
}
