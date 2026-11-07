import { API_BASE_URL as BACKEND_BASE_URL } from './apiConfig';
const API_BASE_URL = BACKEND_BASE_URL;

export type ExternalArticle = {
  id: number; title: string; description: string | null;
  sourceName: string; sourceUrl: string | null; articleUrl: string;
  imageUrl: string | null; category: string; publishedAt: string | null;
};
export type ExternalNewsResult = {
  items: ExternalArticle[]; total: number; page: number; limit: number;
  providerWarning: string | null;
};
export async function getExternalNews(params: { category: string; query: string; page: number }): Promise<ExternalNewsResult> {
  const search = new URLSearchParams({ category: params.category, query: params.query, page: String(params.page), limit: '12' });
  const response = await fetch(`${API_BASE_URL}/api/external-news?${search}`, { credentials: 'include' });
  if (!response.ok) throw new Error((await response.json().catch(() => null))?.message || 'Unable to load news');
  return response.json();
}
