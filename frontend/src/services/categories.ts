import { API_BASE_URL as BACKEND_BASE_URL } from './apiConfig';
const API_URL =
  `${BACKEND_BASE_URL}/api/categories`;

export type Category = {
  category_id: number;
  name: string;
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

export async function getCategories(): Promise<
  Category[]
> {
  const response = await fetch(API_URL);

  const data =
    await getResponseData(response);

  return data.categories;
}