export type ArticleRating = {
  averageRating: number;
  ratingCount: number;
  userRating: number | null;
};

export type RateArticleResponse = {
  message: string;
  averageRating: number;
  ratingCount: number;
  userRating: number;
};

export async function getArticleRating(
  articleId: number,
): Promise<ArticleRating> {
  const response = await fetch(
    `http://localhost:3000/api/articles/${articleId}/rating`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to load article rating",
    );
  }

  return data;
}

export async function rateArticle(
  articleId: number,
  rating: number,
): Promise<RateArticleResponse> {
  const response = await fetch(
    `http://localhost:3000/api/articles/${articleId}/rating`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        rating,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to save rating",
    );
  }

  return data;
}