import { API_BASE_URL as BACKEND_BASE_URL } from '../services/apiConfig';
import { useCallback, useEffect, useState } from 'react';
import '../styles/Friends.css';

type Person = { user_id: number; username: string; full_name?: string | null; friendship_id?: number | null; friendship_status?: 'pending' | 'accepted' | 'rejected' | null; requester_id?: number | null };
type Friend = Person & { friendship_id: number; friends_since?: string };
type Request = Person & { friendship_id: number; requester_id: number; addressee_id: number; created_at: string; status: 'pending' };
type Requests = { incoming: Request[]; outgoing: Request[] };

const BASE = `${BACKEND_BASE_URL}/api`;
async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body && typeof body === 'object' && 'message' in body && typeof body.message === 'string'
      ? body.message : `Request failed (${response.status})`;
    throw new Error(response.status === 401 ? 'Please log in before using Friends.' : message);
  }
  return body as T;
}

function displayName(person: Person) { return person.full_name?.trim() || person.username; }

export default function Friends() {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<Requests>({ incoming: [], outgoing: [] });
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    const [friendsData, requestData] = await Promise.all([
      api<{ friends: Friend[] }>('/friends'),
      api<Requests>('/friends/requests'),
    ]);
    setFriends(Array.isArray(friendsData.friends) ? friendsData.friends : []);
    setRequests({
      incoming: Array.isArray(requestData.incoming) ? requestData.incoming : [],
      outgoing: Array.isArray(requestData.outgoing) ? requestData.outgoing : [],
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    refresh().catch(e => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refresh]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setSearching(false); return; }
    setSearching(true);
    try {
      const data = await api<{ users: Person[] }>(`/users/search?q=${encodeURIComponent(q.trim())}`);
      setResults(Array.isArray(data.users) ? data.users : []);
    } catch (e) { setError(e instanceof Error ? e.message : 'Search failed'); }
    finally { setSearching(false); }
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) { setResults([]); return; }
    const timer = window.setTimeout(() => { void search(query); }, 350);
    return () => window.clearTimeout(timer);
  }, [query, search]);

  async function act(key: string, path: string, method: string, body?: object) {
    setBusy(key); setError(''); setNotice('');
    try {
      const result = await api<{ message?: string }>(path, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      setNotice(result.message || 'Updated successfully');
      await refresh();
      if (query.trim().length >= 2) await search(query);
    } catch (e) { setError(e instanceof Error ? e.message : 'Action failed'); }
    finally { setBusy(null); }
  }

  const btn = (label: string, key: string, path: string, method: string, body?: object, danger = false) => (
    <button type="button" className={danger ? 'friends-btn danger' : 'friends-btn'} disabled={busy !== null} onClick={() => void act(key, path, method, body)}>
      {busy === key ? 'Working…' : label}
    </button>
  );

  return (
    <main className="friends-page">
      <header className="friends-header"><h1>Friends</h1><p>Find people, manage requests, and stay connected.</p></header>
      {error && <div role="alert" className="friends-alert error">{error} <button type="button" onClick={() => { setError(''); void refresh().catch(e => setError(e.message)); }}>Retry</button></div>}
      {notice && <div role="status" className="friends-alert success">{notice}</div>}
      {loading ? <p>Loading friends…</p> : <>
        <section className="friends-panel">
          <h2>Find users</h2>
          <label htmlFor="friend-search">Search by username or full name</label>
          <input id="friend-search" type="search" value={query} maxLength={50} onChange={e => setQuery(e.target.value)} placeholder="Enter at least 2 characters" />
          {searching && <p className="friends-muted">Searching…</p>}
          {!searching && query.trim().length >= 2 && results.length === 0 && <p className="friends-muted">No users found.</p>}
          <div className="friends-list">{results.map(person => <div className="friends-person" key={person.user_id}>
            <div><strong>{displayName(person)}</strong><span>@{person.username}</span></div>
            {person.friendship_status === 'accepted' ? <span className="friends-pill">Friends</span>
              : person.friendship_status === 'pending' ? <span className="friends-pill">Request pending</span>
              : btn('Add friend', `add-${person.user_id}`, '/friends/requests', 'POST', { recipientId: person.user_id })}
          </div>)}</div>
        </section>
        <section className="friends-panel"><h2>Incoming requests ({requests.incoming.length})</h2>
          {requests.incoming.length === 0 && <p className="friends-muted">No incoming requests.</p>}
          <div className="friends-list">{requests.incoming.map(r => <div className="friends-person" key={r.friendship_id}>
            <div><strong>{displayName(r)}</strong><span>@{r.username}</span></div>
            <div className="friends-actions">
              {btn('Accept', `accept-${r.friendship_id}`, `/friends/requests/${r.friendship_id}/accept`, 'PATCH')}
              {btn('Reject', `reject-${r.friendship_id}`, `/friends/requests/${r.friendship_id}/reject`, 'PATCH', undefined, true)}
            </div>
          </div>)}</div>
        </section>
        <section className="friends-panel"><h2>Outgoing requests ({requests.outgoing.length})</h2>
          {requests.outgoing.length === 0 && <p className="friends-muted">No outgoing requests.</p>}
          <div className="friends-list">{requests.outgoing.map(r => <div className="friends-person" key={r.friendship_id}>
            <div><strong>{displayName(r)}</strong><span>@{r.username}</span></div>
            {btn('Cancel', `cancel-${r.friendship_id}`, `/friends/requests/${r.friendship_id}`, 'DELETE', undefined, true)}
          </div>)}</div>
        </section>
        <section className="friends-panel"><h2>My friends ({friends.length})</h2>
          {friends.length === 0 && <p className="friends-muted">No friends yet. Search for someone above!</p>}
          <div className="friends-list">{friends.map(f => <div className="friends-person" key={f.friendship_id}>
            <div><strong>{displayName(f)}</strong><span>@{f.username}</span></div>
            {btn('Remove', `remove-${f.friendship_id}`, `/friends/${f.friendship_id}`, 'DELETE', undefined, true)}
          </div>)}</div>
        </section>
        <button className="friends-btn" type="button" onClick={() => { setError(''); void refresh().catch(e => setError(e.message)); }}>Refresh requests</button>
      </>}
    </main>
  );
}
