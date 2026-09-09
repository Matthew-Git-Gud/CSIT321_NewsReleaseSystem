const API_URL =
  "http://localhost:3000/api";

export type SubmitAppealResponse = {
  message: string;
  appealId: number;
};

export type SuspensionAppeal = {
  appeal_id: number;
  user_id: number;

  username: string;
  full_name: string;
  email: string;

  reason: string;

  status:
    | "pending"
    | "approved"
    | "rejected";

  submitted_at: string;
};

export type AppealReviewStatus =
  | "approved"
  | "rejected";

// =========================
// USER: SUBMIT APPEAL
// =========================

export async function submitAppeal(
  appealToken: string,
  reason: string,
): Promise<SubmitAppealResponse> {
  const response = await fetch(
    `${API_URL}/appeals`,
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      body: JSON.stringify({
        appealToken,
        reason,
      }),
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to submit appeal",
    );
  }

  return data;
}

// =========================
// ADMIN: GET APPEALS
// =========================

export async function getPendingAppeals(): Promise<
  SuspensionAppeal[]
> {
  const response = await fetch(
    `${API_URL}/admin/appeals`,
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
        "Unable to load appeals",
    );
  }

  return data;
}

// =========================
// ADMIN: REVIEW APPEAL
// =========================

export async function reviewAppeal(
  appealId: number,
  status: AppealReviewStatus,
  adminResponse?: string,
): Promise<{ message: string }> {
  const response = await fetch(
    `${API_URL}/admin/appeals/${appealId}`,
    {
      method: "PUT",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        status,
        adminResponse:
          adminResponse?.trim() ||
          null,
      }),
    },
  );

  const data =
    await response.json();

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to review appeal",
    );
  }

  return data;
}