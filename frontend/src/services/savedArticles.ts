import type {
  ArticlePreview,
} from "./articles";

const API_URL =
  "http://localhost:3000/api";

export type SavedArticle =
  ArticlePreview & {
    saved_at: string;
  };

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

export async function getSavedArticles():
  Promise<SavedArticle[]> {
  const response = await fetch(
    `${API_URL}/saved-articles`,
    {
      credentials: "include",
    },
  );

  const data =
    await getResponseData(response);

  return data.articles;
}

export async function getSavedStatus(
  articleId: number,
): Promise<boolean> {
  const response = await fetch(
    `${API_URL}/articles/${articleId}/saved`,
    {
      credentials: "include",
    },
  );

  const data =
    await getResponseData(response);

  return data.saved;
}

export async function saveArticle(
  articleId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/articles/${articleId}/save`,
    {
      method: "POST",
      credentials: "include",
    },
  );

  await getResponseData(response);
}

export async function unsaveArticle(
  articleId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/articles/${articleId}/save`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  await getResponseData(response);
}