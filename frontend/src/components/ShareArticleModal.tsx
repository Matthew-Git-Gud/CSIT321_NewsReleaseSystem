import { useEffect, useState, type FormEvent } from 'react';
import { getFriends, type FriendUser } from '../services/friends';
import { shareArticle } from '../services/shares';
import '../styles/ShareArticleModal.css';
type Props = { articleId: number; onClose: () => void };
export default function ShareArticleModal({ articleId, onClose }: Props) {
 const [username, setUsername] = useState('');
 const [friends, setFriends] = useState<FriendUser[]>([]);
 useEffect(() => { let active = true; getFriends().then(data => { if (active) setFriends(data); }).catch(() => {}); return () => { active = false; }; }, []);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState('');
 const [success, setSuccess] = useState(false);
 async function submit(event: FormEvent) {
  event.preventDefault(); setBusy(true); setError('');
  try { await shareArticle(articleId, username.trim()); setSuccess(true); }
  catch (e) { setError(e instanceof Error ? e.message : 'Unable to share article'); }
  finally { setBusy(false); }
 }
 return <div className="share-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
  <section className="share-modal" role="dialog" aria-modal="true" aria-labelledby="share-modal-title">
   <h2 id="share-modal-title">Share this article</h2>
   {success ? <><p>Article shared successfully.</p><button type="button" onClick={onClose}>Done</button></> :
   <form onSubmit={submit}>
    {friends.length > 0 && <><label htmlFor="share-friend">Or select a friend</label><select id="share-friend" value={friends.some(friend => friend.username === username) ? username : ''} onChange={e => setUsername(e.target.value)}><option value="">Choose a friend</option>{friends.map(friend => <option key={friend.user_id} value={friend.username}>{friend.full_name || friend.username} (@{friend.username})</option>)}</select></>}
    <label htmlFor="share-recipient">Recipient username</label>
    <input id="share-recipient" autoFocus required maxLength={100} value={username} onChange={e => setUsername(e.target.value)} placeholder="Enter exact username" />
    {error && <p role="alert" className="share-error">{error}</p>}
    <div className="share-modal-actions"><button type="button" onClick={onClose}>Cancel</button><button type="submit" disabled={busy || !username.trim()}>{busy ? 'Sharing…' : 'Share'}</button></div>
   </form>}
  </section>
 </div>;
}
