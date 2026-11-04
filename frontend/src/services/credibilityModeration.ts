export type CredibilityClaim = {
  claim: string;
  status: 'supported' | 'not_verified' | 'contradicted' | 'opinion_or_non_factual';
  severity: 'low' | 'medium' | 'high';
  explanation: string;
  evidence: Array<{ source_url: string | null; source_title: string; explanation: string }>;
};

export type CredibilityQueueItem = {
  article_id: number;
  title: string;
  summary: string | null;
  content: string;
  article_status: string;
  created_at: string;
  author: string;
  author_name: string;
  analysis_status: string;
  classification: 'contradictory' | 'partially_supported';
  generated_at: string | null;
  moderation_status: 'pending_review' | 'under_review';
  admin_notes: string | null;
  report: {
    classification: string;
    summary: string;
    claims: CredibilityClaim[];
    sources?: Array<{ status: string; url: string; title?: string | null; message?: string | null }>;
    retrievedCount?: number;
    unavailableCount?: number;
  };
};

const API = 'http://localhost:3000/api/admin/credibility';

export async function getCredibilityQueue(): Promise<CredibilityQueueItem[]> {
  const response = await fetch(API, { credentials: 'include' });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Unable to load moderation queue');
  return Array.isArray(data.items) ? data.items : [];
}

export async function updateCredibilityModeration(
  articleId: number,
  status: 'under_review' | 'approved' | 'revision_requested' | 'removed',
  notes: string,
): Promise<void> {
  const response = await fetch(`${API}/${articleId}/status`, {
    method: 'PUT',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Unable to save moderation decision');
}
