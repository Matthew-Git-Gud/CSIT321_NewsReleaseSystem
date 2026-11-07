import { API_BASE_URL as BACKEND_BASE_URL } from './apiConfig';
const API_BASE = `${BACKEND_BASE_URL}/api`;

export type CredibilityClassification = "supported" | "insufficient_evidence" | "partially_supported" | "contradictory";
export type ClaimStatus = "supported" | "not_verified" | "contradicted" | "opinion_or_non_factual";

export type CredibilityEvidence = {
  source_url: string | null;
  source_title: string;
  explanation: string;
};

export type CredibilityClaim = {
  claim: string;
  status: ClaimStatus;
  severity: "low" | "medium" | "high";
  explanation: string;
  evidence: CredibilityEvidence[];
};

export type CredibilitySource = {
  status: "retrieved" | "unavailable";
  url: string;
  title?: string | null;
  message?: string | null;
};

export type CredibilityAssessment = {
  classification: CredibilityClassification;
  confidence: number | null;
  summary: string;
  claims: CredibilityClaim[];
  recommendation: "no_action" | "no_automatic_action" | "request_revision" | "admin_investigation";
  moderationNotice?: string;
  sources: CredibilitySource[];
  retrievedCount: number;
  unavailableCount: number;
};

export async function analyseArticleCredibility(input: { title: string; content: string }): Promise<CredibilityAssessment> {
  const response = await fetch(`${API_BASE}/ai/credibility/analyse`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `Credibility analysis failed (${response.status})`);
  return data as CredibilityAssessment;
}
