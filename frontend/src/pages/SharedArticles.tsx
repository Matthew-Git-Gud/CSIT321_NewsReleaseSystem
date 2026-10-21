import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getSharedArticles, type SharedArticle } from '../services/shares';
export default function SharedArticles() {
 const [items, setItems] = useState<SharedArticle[]>([]);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState('');
 useEffect(() => { let active = true; getSharedArticles().then(data => { if (active) setItems(data); }).catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
 return <main style={{ maxWidth: 850, margin: '2rem auto', padding: '0 1rem' }}><h1>Shared with me</h1>
  {loading && <p>Loading…</p>}{error && <p role="alert">{error}</p>}
  {!loading && !error && !items.length && <p>No articles have been shared with you yet.</p>}
  {items.map(item => <article key={item.share_id} style={{ padding: 16, borderBottom: '1px solid #ddd' }}>
   <h2><Link to={`/articles/${item.article_id}`}>{item.title}</Link></h2><p>{item.summary}</p><small>Shared by {item.shared_by} · {new Date(item.shared_at).toLocaleString()}</small>
  </article>)}
 </main>;
}
