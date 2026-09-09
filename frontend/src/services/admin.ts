export type AdminCategory = {
  category_id: number;
  name: string;
};

export type AdminArticle = {
  article_id: number;
  title: string;

  status:
    | "draft"
    | "published"
    | "deleted";

  created_at: string;

  author: string;
  author_name: string;
  category: string;
};

export type DashboardSummary = {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  deletedArticles: number;
};

export type AdminUser = {
  user_id: number;
  username: string;
  email: string;
  full_name: string;
  role: "registered" | "admin";
  status: "active" | "suspended";
  created_at: string;
};

const API_URL =
  "http://localhost:3000/api/admin";

export async function getAdminUsers(
  search = "",
): Promise<AdminUser[]> {
  const params =
    new URLSearchParams();

  if (search.trim()) {
    params.set(
      "search",
      search.trim(),
    );
  }

  const query =
    params.toString();

  const response = await fetch(
    `http://localhost:3000/api/admin/users${
      query ? `?${query}` : ""
    }`,
    {
      credentials: "include",
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to load users",
    );
  }

  return data.users;
}

export async function updateUserStatus(
  userId: number,
  status: "active" | "suspended",
): Promise<void> {
  const response = await fetch(
    `http://localhost:3000/api/admin/users/${userId}/status`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        status,
      }),
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to update user status",
    );
  }
}

async function getResponseData(
  response: Response,
) {
  const data = await response
    .json()
    .catch(() => ({
      message:
        "Unexpected server response",
    }));

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Request failed",
    );
  }

  return data;
}

export async function getAdminDashboard(
  filters: {
    search?: string;
    status?: string;
    categoryId?: string;
  },
) {
  const query =
    new URLSearchParams();

  if (filters.search) {
    query.set(
      "search",
      filters.search,
    );
  }

  if (filters.status) {
    query.set(
      "status",
      filters.status,
    );
  }

  if (filters.categoryId) {
    query.set(
      "categoryId",
      filters.categoryId,
    );
  }

  const response = await fetch(
    `${API_URL}/dashboard?${query.toString()}`,
    {
      credentials: "include",
    },
  );

  return getResponseData(
    response,
  ) as Promise<{
    summary: DashboardSummary;
    categories: AdminCategory[];
    articles: AdminArticle[];
  }>;
}

export async function deleteAdminArticle(
  articleId: number,
): Promise<void> {
  const response = await fetch(
    `http://localhost:3000/api/admin/articles/${articleId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to delete article",
    );
  }
}

export type AdminEditableArticle = {
  article_id: number;
  author_id: number;
  category_id: number;
  title: string;
  summary: string;
  content: string;
  status:
    | "draft"
    | "published"
    | "deleted";
  created_at: string;
  updated_at: string;
  category: string;
  author: string;
  author_name: string;
};

export type AdminArticleUpdate = {
  title: string;
  summary: string;
  content: string;
  category_id: number;
  status:
    | "draft"
    | "published";
};

export async function getAdminArticle(
  articleId: number,
): Promise<AdminEditableArticle> {
  const response = await fetch(
    `http://localhost:3000/api/admin/articles/${articleId}`,
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
        "Unable to load article",
    );
  }

  return data.article;
}

export async function updateAdminArticle(
  articleId: number,
  article: AdminArticleUpdate,
): Promise<AdminEditableArticle> {
  const response = await fetch(
    `http://localhost:3000/api/admin/articles/${articleId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type":
          "application/json",
      },
      credentials: "include",
      body: JSON.stringify(
        article,
      ),
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to update article",
    );
  }

  return data.article;
}

export type AdminArticleReport = {
  report_id: number;
  article_id: number;
  reporter_id: number;
  reason:
    | "misinformation"
    | "inappropriate"
    | "spam"
    | "harassment"
    | "other";
  details: string | null;
  status:
    | "pending"
    | "reviewed"
    | "dismissed";
  created_at: string;

  article_title: string;
  author_id: number;

  reporter_username: string;
  reporter_name: string;

  author_username: string;
  author_name: string;
};

export type ReportReviewStatus =
  | "reviewed"
  | "dismissed";

export async function getPendingReports():
  Promise<AdminArticleReport[]> {
  const response = await fetch(
    "http://localhost:3000/api/admin/reports",
    {
      method: "GET",
      credentials: "include",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to load reports",
    );
  }

  return data;
}

export async function updateReportStatus(
  reportId: number,
  status: ReportReviewStatus,
): Promise<string> {
  const response = await fetch(
    `http://localhost:3000/api/admin/reports/${reportId}/status`,
    {
      method: "PUT",
      headers: {
        "Content-Type":
          "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        status,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to update report",
    );
  }

  return data.message;
}

