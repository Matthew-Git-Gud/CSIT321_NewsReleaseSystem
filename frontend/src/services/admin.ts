export type AdminUser = {
  user_id: number
  username: string
  full_name: string
  role: 'admin'
}

export type AdminCategory = {
  category_id: number
  name: string
}

export type AdminArticle = {
  article_id: number
  title: string
  status: 'draft' | 'published' | 'archived' | 'deleted'
  created_at: string
  author: string
  category: string
}

export type DashboardSummary = {
  totalArticles: number
  publishedArticles: number
  draftArticles: number
  archivedArticles: number
}

const AUTH_URL = 'http://localhost:3000/api/auth'
const ADMIN_URL = 'http://localhost:3000/api/admin'

async function getResponseData(response: Response) {
  const data = await response.json().catch(() => ({ message: 'Unexpected server response' }))

  if (!response.ok) {
    throw new Error(data.message || 'Request failed')
  }

  return data
}

// Admin login uses a separate endpoint so the server checks the user's role before issuing a session.
export async function adminLogin(email: string, password: string): Promise<AdminUser> {
  const response = await fetch(`${AUTH_URL}/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password }),
  })

  const data = await getResponseData(response)
  return data.user
}

export async function getAdminDashboard(filters: {
  search?: string
  status?: string
  categoryId?: string
}) {
  const query = new URLSearchParams()

  if (filters.search) query.set('search', filters.search)
  if (filters.status) query.set('status', filters.status)
  if (filters.categoryId) query.set('categoryId', filters.categoryId)

  const response = await fetch(`${ADMIN_URL}/dashboard?${query.toString()}`, {
    credentials: 'include',
  })

  return getResponseData(response) as Promise<{
    summary: DashboardSummary
    categories: AdminCategory[]
    articles: AdminArticle[]
  }>
}
