const API_BASE = "http://localhost:3000/api";
export type MediaResult = { url: string; type: "image" | "video" };
export async function uploadArticleMedia(file: File): Promise<MediaResult> {
  const data = new FormData();
  data.append("media", file);
  const response = await fetch(`${API_BASE}/media`, { method: "POST", body: data, credentials: "include" });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || `Upload failed (${response.status})`);
  return result as MediaResult;
}
