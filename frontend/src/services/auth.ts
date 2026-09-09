export type User = {
  user_id: number
  username: string
  full_name: string
  role: 'registered' | 'admin'
}

const API_URL = 'http://localhost:3000/api/auth'

type RegisterData = {
  full_name: string
  username: string
  email: string
  password: string
}

export class AuthError extends Error {
  suspended: boolean;
  canAppeal: boolean;
  appealToken: string | null;

  constructor(
    message: string,
    options?: {
      suspended?: boolean;
      canAppeal?: boolean;
      appealToken?: string;
    },
  ) {
    super(message);

    this.name = "AuthError";

    this.suspended =
      options?.suspended ?? false;

    this.canAppeal =
      options?.canAppeal ?? false;

    this.appealToken =
      options?.appealToken ?? null;
  }
}

async function getResponseData(response: Response) {
  const data = await response.json().catch(() => ({ message: 'Unexpected server response' }))

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

export async function register(formData: RegisterData) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(formData),
  })

  return getResponseData(response)
}

export async function login(
  email: string,
  password: string,
): Promise<User> {
  const response = await fetch(
    `${API_URL}/login`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",

      body: JSON.stringify({
        email,
        password,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new AuthError(
      data.message ||
        "Unable to sign in",
      {
        suspended:
          data.suspended === true,
        canAppeal:
          data.canAppeal === true,
        appealToken:
          data.appealToken,
      },
    );
  }

  return data.user;
}

export async function logout() {
  const response = await fetch(`${API_URL}/logout`, {
    method: 'POST',
    credentials: 'include',
  })

  return getResponseData(response)
}

export async function getCurrentUser(): Promise<User | null> {
  const response = await fetch(`${API_URL}/me`, {
    method: 'GET',
    credentials: 'include',
  })

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    return null;
  }

  const data = await getResponseData(response)
  
  if (!response.ok) {
    throw new Error(
      data.message ||
        "Unable to get current user",
    );
  }
  return data.user
}
