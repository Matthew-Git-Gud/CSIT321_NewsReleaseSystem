import { useEffect, useState, type FormEvent } from 'react';
import { getExternalNews, type ExternalArticle } from '../services/externalNews';
import '../styles/NewsDiscover.css';

const CATEGORIES = ['all', 'general', 'world', 'business', 'technology', 'science', 'health', 'sports', 'entertainment'];
export default function NewsDiscover() {
  const [category, setCategory] = useState('all');
  const [draft, setDraft] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<ExternalArticle[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    getExternalNews({ category, query, page })
      .then(data => {
        if (!active) return;
        setItems(data.items); setTotal(data.total); setWarning(data.providerWarning || '');
      })
      .catch(err => { if (active) { setError(err instanceof Error ? err.message : 'Unable to load news'); setItems([]); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [category, query, page]);

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setPage(1); setQuery(draft.trim());
  }
  return (
    <main className="discover-page">
      <header className="discover-header"><h1>Discover News</h1><p>Explore news from external publishers. Open a story to read it at its original source.</p></header>
      <form className="discover-search" onSubmit={search}>
        <input aria-label="Search news topics" placeholder="Search news topics..." value={draft} onChange={event => setDraft(event.target.value)} maxLength={120} />
        <button type="submit">Search</button>
        {query && <button type="button" onClick={() => { setDraft(''); setQuery(''); setPage(1); }}>Clear</button>}
      </form>
      <nav className="discover-categories" aria-label="News categories">
        {CATEGORIES.map(value => <button key={value} type="button" className={category === value ? 'selected' : ''} onClick={() => { setCategory(value); setPage(1); }}>{value === 'all' ? 'All' : value[0].toUpperCase() + value.slice(1)}</button>)}
      </nav>
      {warning && <p role="status" className="discover-warning">{warning}</p>}
      {error && <p role="alert">{error}</p>}
      {loading ? <p>Loading news...</p> : items.length === 0 ? <p>No articles found. Try another category or search.</p> : (
        <div className="discover-grid">{items.map(item => (
          <article className="discover-card" key={item.id}>
            {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />}
            <div className="discover-card-body">
              <span className="discover-source">{item.sourceName} · {item.category}</span>
              <h2><a href={item.articleUrl} target="_blank" rel="noopener noreferrer">{item.title}</a></h2>
              {item.description && <p>{item.description}</p>}
              {item.publishedAt && <small>{new Date(item.publishedAt).toLocaleDateString()}</small>}
              <a className="discover-original" href={item.articleUrl} target="_blank" rel="noopener noreferrer">Read original article ↗</a>
            </div>
          </article>
        ))}</div>
      )}
      <div className="discover-pagination">
        <button disabled={loading || page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
        <span>Page {page} · {total} results</span>
        <button disabled={loading || page * 12 >= total} onClick={() => setPage(p => p + 1)}>Next</button>
      </div>
    </main>
  );
}
