const API_URL = "http://localhost:3000/api/articles";

export type ArticleStatus =
  | "draft"
  | "published"
  | "deleted";

export type CreateArticleStatus =
  | "draft"
  | "published";

export type ArticleFormData = {
  title: string;
  summary: string;
  content: string;
  category_id: number;
  status: CreateArticleStatus;
};

export type ArticlePreview = {
  article_id: number;
  author_id: number;
  category_id: number;

  title: string;
  summary: string;
  category: string;

  author_name: string;
  author_username: string;

  created_at: string;
  updated_at: string;
};

export type Article = {
  article_id: number;
  author_id: number;
  category_id: number;

  title: string;
  summary: string;
  content: string;

  status: ArticleStatus;

  category: string;

  created_at: string;
  updated_at: string;

  author_name?: string;
  author_username?: string;
};

async function getResponseData(
  response: Response,
) {
  const data = await response
    .json()
    .catch(() => ({
      message: "Unexpected server response",
    }));

  if (!response.ok) {
    throw new Error(
      data.message || "Request failed",
    );
  }

  return data;
}

export async function getPublishedArticles():
  Promise<ArticlePreview[]> {
  const response = await fetch(API_URL, {
    method: "GET",
  });

  const data = await getResponseData(response);

  return data.articles;
}

export async function createArticle(
  article: ArticleFormData,
): Promise<Article> {
  const response = await fetch(API_URL, {
    method: "POST",

    headers: {
      "Content-Type": "application/json",
    },

    credentials: "include",

    body: JSON.stringify(article),
  });

  const data =
    await getResponseData(response);

  return data.article;
}

export async function getMyArticles(): Promise<Article[]> {
  const response = await fetch(`${API_URL}/mine`, {
    method: "GET",
    credentials: "include",
  });

  const data = await getResponseData(response);

  return data.articles;
}

export async function deleteArticle(
  articleId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/${articleId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  await getResponseData(response);
}

export async function getArticleForEdit(
  articleId: number,
): Promise<Article> {
  const response = await fetch(
    `${API_URL}/${articleId}/edit`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const data = await getResponseData(response);

  return data.article;
}

export async function updateArticle(
  articleId: number,
  article: ArticleFormData,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/${articleId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
      },

      credentials: "include",

      body: JSON.stringify(article),
    },
  );

  await getResponseData(response);
}

export async function getArticleById(
  articleId: number,
): Promise<Article> {
  const response = await fetch(
    `${API_URL}/${articleId}`,
    {
      method: "GET",
    },
  );

  const data = await getResponseData(response);

  return data.article;
}

export async function getPersonalisedFeed(): Promise<Article[]> {
  const response = await fetch(
    "http://localhost:3000/api/articles/feed",
    {
      method: "GET",
      credentials: "include",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to load personalised feed",
    );
  }

  return data.articles;
}