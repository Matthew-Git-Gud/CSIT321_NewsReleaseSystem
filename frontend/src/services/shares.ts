const API = 'http://localhost:3000/api';
async function parse(response: Response) {
 const body = await response.json().catch(() => ({}));
 if (!response.ok) throw new Error(body.message || `Request failed (${response.status})`);
 return body;
}
export async function shareArticle(articleId: number, recipientUsername: string): Promise<void> {
 await parse(await fetch(`${API}/articles/${articleId}/share`, {
  method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ recipientUsername }),
 }));
}
export type SharedArticle = { share_id: number; article_id: number; title: string; summary: string; shared_by: string; shared_at: string };
export async function getSharedArticles(): Promise<SharedArticle[]> {
 const data = await parse(await fetch(`${API}/articles/shared-with-me`, { credentials: 'include' }));
 return data.articles;
}
