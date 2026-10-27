import { useEffect, useRef, useState } from 'react';
import { generateAiSummary, getAiSummary } from '../services/aiSummaries';
import '../styles/AiSummaryPanel.css';

type Props = { articleId: number; canGenerate: boolean };

export default function AiSummaryPanel({ articleId, canGenerate }: Props) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [error, setError] = useState('');
  const requestId = useRef(0);

  useEffect(() => {
    const controller = new AbortController();
    requestId.current += 1;
    setSummary(null);
    setLoading(true);
    setGenerating(false);
    setError('');
    setCollapsed(false);
    getAiSummary(articleId, controller.signal)
      .then(data => { if (!controller.signal.aborted) setSummary(data.summary); })
      .catch(err => { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : 'Unable to load summary'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [articleId]);

  async function handleGenerate(force: boolean) {
    if (generating || !canGenerate) return;
    const id = requestId.current;
    setGenerating(true);
    setError('');
    try {
      const result = await generateAiSummary(articleId, force);
      if (id === requestId.current) { setSummary(result.summary); setCollapsed(false); }
    } catch (err) {
      if (id === requestId.current) setError(err instanceof Error ? err.message : 'Unable to generate summary');
    } finally {
      if (id === requestId.current) setGenerating(false);
    }
  }

  return (
    <section className="ai-summary-panel" aria-label="AI article summary">
      <div className="ai-summary-heading">
        <h2>✦ AI Summary</h2>
        {summary && <button type="button" onClick={() => setCollapsed(value => !value)} aria-expanded={!collapsed}>{collapsed ? 'Expand' : 'Collapse'}</button>}
      </div>
      {loading ? <p role="status">Loading summary…</p> : (
        <>
          {summary && !collapsed && <p className="ai-summary-text">{summary}</p>}
          {!summary && <p>No AI summary has been generated for this article yet.</p>}
          {!canGenerate && !summary && <p>Sign in to generate a summary.</p>}
          {canGenerate && (
            <button type="button" className="ai-summary-action" disabled={generating} onClick={() => handleGenerate(Boolean(summary))}>
              {generating ? 'Generating…' : summary ? 'Regenerate summary' : 'Generate AI summary'}
            </button>
          )}
        </>
      )}
      {error && <p className="ai-summary-error" role="alert">{error}</p>}
      <small>AI-generated content may contain errors. Check the original article for important details.</small>
    </section>
  );
}
