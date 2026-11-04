import {
  DEFAULT_ACCENT_COLOUR,
  isAccentColour,
  type AccentColour,
} from "../constants/appearance";

const API_URL =
  "http://localhost:3000/api/preferences";

export type Category = {
  category_id: number;
  name: string;
};

export type SavedPreferences = {
  preferences: Category[];
  accentColour: AccentColour;
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

export async function getCategories():
  Promise<Category[]> {
  const response = await fetch(
    `${API_URL}/categories`,
    {
      credentials: "include",
    },
  );

  const data =
    await getResponseData(response);

  return data.categories;
}

export async function getPreferences():
  Promise<SavedPreferences> {
  const response = await fetch(
    API_URL,
    {
      credentials: "include",
    },
  );

  const data =
    await getResponseData(response);

  return {
    preferences: data.preferences,
    // Older servers do not return an accent yet, so keep the page usable
    // while a teammate is restarting their local backend.
    accentColour: isAccentColour(
      data.accentColour,
    )
      ? data.accentColour
      : DEFAULT_ACCENT_COLOUR,
  };
}

export async function savePreferences(
  categoryIds: number[],
  accentColour: AccentColour,
) {
  const response = await fetch(
    API_URL,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        categoryIds,
        accentColour,
      }),
    },
  );

  return getResponseData(
    response,
  );
}
