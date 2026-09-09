export type ReportReason =
  | "misinformation"
  | "inappropriate"
  | "spam"
  | "harassment"
  | "other";

export type CreateReportData = {
  reason: ReportReason;
  details?: string;
};

export type ArticleReport = {
  report_id: number;
  article_id: number;
  reporter_id: number;
  reason: ReportReason;
  details: string | null;
  status: "pending";
};

type CreateReportResponse = {
  message: string;
  report: ArticleReport;
};

export async function reportArticle(
  articleId: number,
  report: CreateReportData,
): Promise<CreateReportResponse> {
  const response = await fetch(
    `http://localhost:3000/api/articles/${articleId}/reports`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(report),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to report article",
    );
  }

  return data;
}

export type ReportStatus = {
  isAuthor: boolean;
  hasReported: boolean;
};

export async function getReportStatus(
  articleId: number,
): Promise<ReportStatus> {
  const response = await fetch(
    `http://localhost:3000/api/articles/${articleId}/report-status`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to load report status",
    );
  }

  return data;
}