import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getCredibilityQueue,
  updateCredibilityModeration,
  type CredibilityQueueItem,
} from '../services/credibilityModeration';
import '../styles/AdminCredibility.css';

const label: Record<string, string> = {
  supported: 'Supported', insufficient_evidence: 'Insufficient evidence',
  partially_supported: 'Partially supported', contradictory: 'Contradictory',
  not_verified: 'Not verified', contradicted: 'Contradicted',
  opinion_or_non_factual: 'Opinion / non-factual',
};

function AdminCredibility() {
  const [items, setItems] = useState<CredibilityQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'pending_review' | 'under_review'>('pending_review');

  const load = useCallback(async () => {
    try { setError(''); setItems(await getCredibilityQueue()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load queue'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const decide = async (item: CredibilityQueueItem, status: 'under_review' | 'approved' | 'revision_requested' | 'removed') => {
    const prompts: Record<typeof status, string> = {
      under_review: 'Mark as under investigation', approved: 'Approve this article',
      revision_requested: 'Request author revision', removed: 'Remove this article',
    };
    if (status === 'removed' && !window.confirm('Remove this published article? This changes its article status to deleted.')) return;
    if (status === 'approved' && !window.confirm('Approve this article and close the moderation review?')) return;
    try {
      setSaving(item.article_id);
      await updateCredibilityModeration(item.article_id, status, notes[item.article_id] || '');
      if (status === 'under_review') setActiveTab('under_review');
      await load();
      setExpanded(null);
    } catch (e) { setError(e instanceof Error ? e.message : prompts[status] + ' failed'); }
    finally { setSaving(null); }
  };

  const pendingItems = items.filter(item => item.moderation_status === 'pending_review');
  const investigatingItems = items.filter(item => item.moderation_status === 'under_review');
  const visibleItems = activeTab === 'pending_review' ? pendingItems : investigatingItems;

  return <main className="admin-credibility-page">
    <div className="admin-credibility-container">
      <div className="credibility-heading">
        <div><p className="credibility-eyebrow">ADMINISTRATION</p><h1>Credibility moderation</h1>
          <p>Review articles flagged by AI evidence analysis. AI findings are advisory; administrators make the final decision.</p></div>
        <button type="button" onClick={() => { setLoading(true); void load(); }}>Refresh queue</button>
      </div>
      <div className="credibility-summary"><strong>{pendingItems.length}</strong><span>Pending review · {investigatingItems.length} under investigation</span></div>
      <div className="credibility-tabs" role="tablist" aria-label="Moderation queues">
        <button type="button" role="tab" aria-selected={activeTab === 'pending_review'} className={activeTab === 'pending_review' ? 'active' : ''} onClick={() => setActiveTab('pending_review')}>Pending Review <span>{pendingItems.length}</span></button>
        <button type="button" role="tab" aria-selected={activeTab === 'under_review'} className={activeTab === 'under_review' ? 'active' : ''} onClick={() => setActiveTab('under_review')}>Under Investigation <span>{investigatingItems.length}</span></button>
      </div>
      {error && <div className="credibility-error" role="alert">{error}</div>}
      {loading ? <p>Loading moderation queue…</p> : visibleItems.length === 0 ?
        <div className="credibility-empty"><h2>{activeTab === 'pending_review' ? 'No articles pending review' : 'No articles under investigation'}</h2><p>{activeTab === 'pending_review' ? 'New contradictory or partially supported assessments will appear here automatically.' : 'Articles marked for investigation will remain here until an administrator makes a decision.'}</p></div> :
        <div className="credibility-list">{visibleItems.map(item => <article className="credibility-card" key={item.article_id}>
          <div className="credibility-card-top">
            <div><span className={`credibility-badge ${item.classification}`}>{label[item.classification] || item.classification}</span>
              <span className={`moderation-status-badge ${item.moderation_status}`}>{item.moderation_status === 'under_review' ? 'Under investigation' : 'Pending review'}</span>
              <h2>{item.title}</h2><p>By {item.author_name || item.author} · Article #{item.article_id}</p></div>
            <Link to={`/articles/${item.article_id}`} target="_blank" rel="noreferrer">View article ↗</Link>
          </div>
          <p className="credibility-report-summary">{item.report?.summary || 'No assessment summary was returned.'}</p>
          <div className="credibility-meta">{item.report?.retrievedCount ?? 0} sources retrieved · {item.report?.unavailableCount ?? 0} unavailable · Analysed {item.generated_at ? new Date(item.generated_at).toLocaleString() : '—'}</div>
          <button className="credibility-expand" type="button" onClick={() => setExpanded(expanded === item.article_id ? null : item.article_id)}>{expanded === item.article_id ? 'Hide evidence' : 'Inspect claims and evidence'}</button>
          {expanded === item.article_id && <div className="credibility-details">
            {(item.report?.claims || []).map((claim, index) => <section className="credibility-claim" key={`${item.article_id}-${index}`}>
              <div className="credibility-claim-heading"><strong>{claim.claim}</strong><span className={`claim-status ${claim.status}`}>{label[claim.status] || claim.status}</span></div>
              <p>{claim.explanation}</p>
              {claim.evidence?.map((evidence, evidenceIndex) => <div className="credibility-evidence" key={evidenceIndex}>
                {evidence.source_url ? <a href={evidence.source_url} target="_blank" rel="noreferrer">{evidence.source_title || evidence.source_url}</a> : <span>{evidence.source_title || 'Evidence'}</span>}
                <p>{evidence.explanation}</p></div>)}
            </section>)}
            <h3>Retrieved sources</h3>
            {(item.report?.sources || []).map((source, index) => <p className="credibility-source" key={index}>{source.status === 'retrieved' ? 'Retrieved' : 'Unavailable'} · <a href={source.url} target="_blank" rel="noreferrer">{source.title || source.url}</a>{source.message ? ` — ${source.message}` : ''}</p>)}
          </div>}
          <label className="credibility-notes-label" htmlFor={`notes-${item.article_id}`}>Administrator notes (optional)</label>
          <textarea id={`notes-${item.article_id}`} rows={2} value={notes[item.article_id] ?? item.admin_notes ?? ''} onChange={e => setNotes(old => ({ ...old, [item.article_id]: e.target.value }))} placeholder="Record the reason for your decision…" />
          <div className="credibility-actions">
            <button disabled={saving === item.article_id} onClick={() => void decide(item, 'under_review')}>Investigate</button>
            <button disabled={saving === item.article_id} onClick={() => void decide(item, 'approved')}>Approve</button>
            <button disabled={saving === item.article_id} onClick={() => void decide(item, 'revision_requested')}>Request revision</button>
            <button className="danger" disabled={saving === item.article_id} onClick={() => void decide(item, 'removed')}>Remove article</button>
          </div>
        </article>)}</div>}
    </div>
  </main>;
}

export default AdminCredibility;
