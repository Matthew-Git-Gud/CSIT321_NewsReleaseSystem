import { API_BASE_URL as BACKEND_BASE_URL } from './apiConfig';

import type { CredibilityAssessment } from './aiCredibility';

const API_BASE = `${BACKEND_BASE_URL}/api`;

export type ReaderCredibilityResult = {
  status: 'not_started' | 'pending' | 'completed' | 'failed';
  classification?: CredibilityAssessment['classification'];
  generated_at?: string;
  report: CredibilityAssessment | null;
  message?: string;
};

async function readResponse(response: Response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data;
}

export async function getReaderCredibility(articleId: number): Promise<ReaderCredibilityResult> {
  const response = await fetch(`${API_BASE}/articles/${articleId}/credibility`);
  return readResponse(response);
}

export async function requestReaderCredibility(articleId: number): Promise<void> {
  const response = await fetch(`${API_BASE}/articles/${articleId}/credibility`, {
    method: 'POST',
    credentials: 'include',
  });
  await readResponse(response);
}
