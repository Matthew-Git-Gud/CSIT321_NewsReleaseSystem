import { API_BASE_URL as BACKEND_BASE_URL } from './apiConfig';
const BASE = `${BACKEND_BASE_URL}/api/articles`;

export type AiSummary = { articleId: number; summary: string | null; cached: boolean };

async function parseResponse(response: Response): Promise<AiSummary> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data as AiSummary;
}

export async function getAiSummary(articleId: number, signal?: AbortSignal): Promise<AiSummary> {
  return parseResponse(await fetch(`${BASE}/${articleId}/summary`, { credentials: 'include', signal }));
}

export async function generateAiSummary(articleId: number, force = false): Promise<AiSummary> {
  return parseResponse(await fetch(`${BASE}/${articleId}/summarize`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ force }),
  }));
}
