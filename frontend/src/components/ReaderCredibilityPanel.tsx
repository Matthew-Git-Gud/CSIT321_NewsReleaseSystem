
import { useEffect, useState } from 'react';
import { getReaderCredibility, requestReaderCredibility, type ReaderCredibilityResult } from '../services/readerCredibility';
import type { CredibilityAssessment } from '../services/aiCredibility';
import '../styles/ReaderCredibilityPanel.css';

type Props = { articleId: number; canGenerate: boolean };

const labels: Record<CredibilityAssessment['classification'], string> = {
  supported: 'Supported',
  insufficient_evidence: 'Insufficient evidence',
  partially_supported: 'Partially supported',
  contradictory: 'Contradictory',
};

const statusLabels = {
  supported: 'Supported',
  not_verified: 'Not verified',
  contradicted: 'Contradicted',
  opinion_or_non_factual: 'Opinion / non-factual',
};

export default function ReaderCredibilityPanel({ articleId, canGenerate }: Props) {
  const [result, setResult] = useState<ReaderCredibilityResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState('');

  async function refresh() {
    const next = await getReaderCredibility(articleId);
    setResult(next);
    return next;
  }

  useEffect(() => {
    let active = true;
    setLoading(true);
    setResult(null);
    setError('');
    getReaderCredibility(articleId)
      .then(data => { if (active) setResult(data); })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : 'Unable to load credibility report'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [articleId]);

  async function handleRequest() {
    if (!canGenerate || requesting) return;
    setRequesting(true);
    setError('');
    try {
      await requestReaderCredibility(articleId);
      for (let attempt = 0; attempt < 40; attempt += 1) {
        await new Promise(resolve => window.setTimeout(resolve, 2000));
        const next = await refresh();
        if (next.status === 'completed') {
          setExpanded(true);
          return;
        }
        if (next.status === 'failed') throw new Error(next.message || 'Credibility analysis failed. Please try again later.');
      }
      throw new Error('Analysis is taking longer than expected. Please check again shortly.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to generate credibility report');
      try { await refresh(); } catch { /* preserve the original request error */ }
    } finally {
      setRequesting(false);
    }
  }

  const report = result?.report;
  return (
    <section className="reader-credibility-panel" aria-label="AI article credibility analysis">
      <div className="reader-credibility-heading">
        <div>
          <p className="reader-credibility-eyebrow">Evidence check</p>
          <h2>AI credibility analysis</h2>
          <p className="reader-credibility-intro">Compare factual claims in this article against its cited sources. Results are advisory and do not determine whether an article can be published.</p>
        </div>
        {report && (
          <span className={`reader-credibility-badge ${report.classification}`}>
            {labels[report.classification]}
          </span>
        )}
      </div>

      {loading ? <p className="reader-credibility-muted">Checking for an existing assessment…</p> : (
        <>
          {report ? (
            <>
              <p className="reader-credibility-summary">{report.summary}</p>
              <div className="reader-credibility-meta">
                {report.claims.length} claims assessed · {report.retrievedCount} sources retrieved · {report.unavailableCount} unavailable
              </div>
              <button type="button" className="reader-credibility-toggle" onClick={() => setExpanded(value => !value)} aria-expanded={expanded}>
                {expanded ? 'Hide claim findings' : 'View claim-by-claim findings'}
              </button>
              {expanded && (
                <div className="reader-credibility-claims">
                  {report.claims.map((claim, index) => (
                    <article className="reader-credibility-claim" key={`${index}-${claim.claim}`}>
                      <div className="reader-credibility-claim-heading">
                        <strong>{claim.claim}</strong>
                        <span className={`reader-credibility-claim-status ${claim.status}`}>{statusLabels[claim.status]}</span>
                      </div>
                      <p>{claim.explanation}</p>
                      {claim.evidence.map((evidence, evidenceIndex) => (
                        <div className="reader-credibility-evidence" key={`${evidence.source_url}-${evidenceIndex}`}>
                          {evidence.source_url && <a href={evidence.source_url} target="_blank" rel="noreferrer">{evidence.source_title || evidence.source_url}</a>}
                          <span>{evidence.explanation}</span>
                        </div>
                      ))}
                    </article>
                  ))}
                </div>
              )}
              <div className="reader-credibility-sources">
                <strong>Source retrieval</strong>
                {report.sources.map((source, index) => (
                  <div key={`${source.url}-${index}`}>
                    <span className={source.status}>{source.status === 'retrieved' ? 'Retrieved' : 'Unavailable'}</span>
                    <a href={source.url} target="_blank" rel="noreferrer">{source.title || source.url}</a>
                    {source.message && <small>{source.message}</small>}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="reader-credibility-empty">
              <p>{result?.status === 'pending' ? 'A credibility assessment is already being prepared.' : 'No credibility assessment is available for this article yet.'}</p>
              {result?.status === 'pending' ? (
                <span>Refresh this page in a moment to check the result.</span>
              ) : canGenerate ? (
                <button type="button" className="reader-credibility-action" disabled={requesting} onClick={handleRequest}>
                  {requesting ? 'Analysing article…' : 'Analyse article credibility'}
                </button>
              ) : <span>Sign in to request an assessment.</span>}
            </div>
          )}
        </>
      )}
      {error && <p className="reader-credibility-error" role="alert">{error}</p>}
      <footer className="reader-credibility-footer">AI findings may be incomplete or incorrect. Review the original sources before drawing conclusions. An administrator makes all moderation decisions.</footer>
    </section>
  );
}
