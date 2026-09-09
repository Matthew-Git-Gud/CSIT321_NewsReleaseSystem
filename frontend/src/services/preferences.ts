const API_URL = 'http://localhost:3000/api/preferences'

export type Category = {
  category_id: number
  name: string
}

async function getResponseData(response: Response) {
  const data = await response.json().catch(() => ({ message: 'Unexpected server response' }))

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

// The same cookie used for sign-in identifies the user to the protected API.
export async function getCategories(): Promise<Category[]> {
  const response = await fetch(`${API_URL}/categories`, { credentials: 'include' })
  const data = await getResponseData(response)
  return data.categories
}

export async function getPreferences(): Promise<Category[]> {
  const response = await fetch(API_URL, { credentials: 'include' })
  const data = await getResponseData(response)
  return data.preferences
}

export async function savePreferences(categoryIds: number[]) {
  const response = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ categoryIds }),
  })

  return getResponseData(response)
}
