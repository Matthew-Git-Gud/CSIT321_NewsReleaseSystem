import { API_BASE_URL as BACKEND_BASE_URL } from './apiConfig';
const API_BASE = `${BACKEND_BASE_URL}/api`;

export type CoverPromptResult = { style: "photorealistic" | "editorial_illustration"; imagePrompt: string };
export type CoverImageResult = { imageDataUrl: string; width: number; height: number };

async function parseResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
  return data as T;
}

export async function generateCoverPrompt(input: { title: string; summary: string; category: string; content: string }): Promise<CoverPromptResult> {
  const response = await fetch(`${API_BASE}/ai/cover-image/prompt`, {
    method: "POST", credentials: "include", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input),
  });
  return parseResponse<CoverPromptResult>(response);
}

export async function generateCoverImage(imagePrompt: string): Promise<CoverImageResult> {
  const response = await fetch(`${API_BASE}/ai/cover-image/generate`, {
    method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imagePrompt, width: 1536, height: 864 }),
  });
  return parseResponse<CoverImageResult>(response);
}
