const API_URL =
  "http://localhost:3000/api";

export type Comment = {
  comment_id: number;
  article_id: number;
  user_id: number;

  comment_text: string;
  is_edited: number;

  username: string;
  full_name: string;

  created_at: string;
  updated_at: string | null;
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

export async function getComments(
  articleId: number,
): Promise<Comment[]> {
  const response = await fetch(
    `${API_URL}/articles/${articleId}/comments`,
  );

  const data =
    await getResponseData(response);

  return data.comments;
}

export async function createComment(
  articleId: number,
  commentText: string,
): Promise<Comment> {
  const response = await fetch(
    `${API_URL}/articles/${articleId}/comments`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        comment_text: commentText,
      }),
    },
  );

  const data =
    await getResponseData(response);

  return data.comment;
}

export async function updateComment(
  commentId: number,
  commentText: string,
): Promise<Comment> {
  const response = await fetch(
    `${API_URL}/comments/${commentId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        comment_text: commentText,
      }),
    },
  );

  const data =
    await getResponseData(response);

  return data.comment;
}

export async function deleteComment(
  commentId: number,
): Promise<void> {
  const response = await fetch(
    `${API_URL}/comments/${commentId}`,
    {
      method: "DELETE",
      credentials: "include",
    },
  );

  await getResponseData(response);
}
