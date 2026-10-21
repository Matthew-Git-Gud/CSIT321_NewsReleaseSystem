import { Link } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import '../styles/NotificationToast.css';

export default function NotificationToast() {
  const { latestIncoming, dismissIncoming, markRead } = useNotifications();
  if (!latestIncoming) return null;

  const handleOpen = () => {
    const id = latestIncoming.notification_id;
    dismissIncoming();
    void markRead(id).catch(error => console.error('Unable to mark notification read:', error));
  };

  return (
    <aside className="notification-toast" role="status" aria-live="polite" aria-label="New notification">
      <div className="notification-toast__content">
        <strong>New notification</strong>
        <p>{latestIncoming.message}</p>
        {latestIncoming.article_id && (
          <Link to={`/articles/${latestIncoming.article_id}`} onClick={handleOpen}>
            Read article →
          </Link>
        )}
      </div>
      <button type="button" aria-label="Dismiss notification" onClick={dismissIncoming}>×</button>
    </aside>
  );
}
