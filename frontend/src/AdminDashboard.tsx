import { useEffect, useState } from 'react'
import ThemeToggle from './ThemeToggle'
import {
  getAdminDashboard,
  type AdminArticle,
  type AdminCategory,
  type DashboardSummary,
} from './services/admin'
import type { User } from './services/auth'
import './AdminDashboard.css'

type AdminDashboardProps = {
  user: User | null
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onLogout: () => void
  onHome: () => void
  onAdminLogin: () => void
}

const emptySummary: DashboardSummary = {
  totalArticles: 0,
  publishedArticles: 0,
  draftArticles: 0,
  archivedArticles: 0,
}

function AdminDashboard({ user, theme, onToggleTheme, onLogout, onHome, onAdminLogin }: AdminDashboardProps) {
  const [summary, setSummary] = useState<DashboardSummary>(emptySummary)
  const [categories, setCategories] = useState<AdminCategory[]>([])
  const [articles, setArticles] = useState<AdminArticle[]>([])
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.role !== 'admin') {
      setLoading(false)
      return
    }

    const delay = window.setTimeout(() => {
      // Query parameters let admins filter without downloading an unbounded article list.
      getAdminDashboard({ search, status, categoryId })
        .then((data) => {
          setSummary(data.summary)
          setCategories(data.categories)
          setArticles(data.articles)
          setError('')
        })
        .catch((requestError) => {
          setError(requestError instanceof Error ? requestError.message : 'Unable to load dashboard')
        })
        .finally(() => setLoading(false))
    }, search ? 250 : 0)

    return () => window.clearTimeout(delay)
  }, [user, search, status, categoryId])

  if (user?.role !== 'admin') {
    return (
      <main className="admin-page admin-access-page">
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <section className="admin-access-card">
          <p className="eyebrow">Restricted area</p>
          <h1>Administrator access required.</h1>
          <p>Sign in with an administrator account to view and manage platform content.</p>
          <button className="primary-button" type="button" onClick={onAdminLogin}>Admin sign in</button>
          <button className="text-button" type="button" onClick={onHome}>Back to home</button>
        </section>
      </main>
    )
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <button className="brand admin-brand" type="button" onClick={onHome}>News Release System</button>
        <div className="admin-header-actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <span>Admin: {user.full_name}</span>
          <button className="sign-in" type="button" onClick={onLogout}>Sign out</button>
        </div>
      </header>

      <section className="admin-content" aria-labelledby="admin-title">
        <div className="admin-title-row">
          <div>
            <p className="eyebrow">Overview</p>
            <h1 id="admin-title">Admin dashboard</h1>
          </div>
          <p className="system-status"><span aria-hidden="true">●</span> System status: Operational</p>
        </div>

        <div className="admin-metrics" aria-label="Article summary">
          <Metric label="Total articles" value={summary.totalArticles} />
          <Metric label="Published" value={summary.publishedArticles} tone="positive" />
          <Metric label="Drafts" value={summary.draftArticles} tone="warning" />
          <Metric label="Archived" value={summary.archivedArticles} tone="neutral" />
        </div>

        <section className="article-management" aria-labelledby="all-articles-heading">
          <div className="article-management-heading">
            <h2 id="all-articles-heading">All articles</h2>
            <div className="admin-filters">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search title or author"
                aria-label="Search articles"
              />
              <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status">
                <option value="">All statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
                <option value="deleted">Deleted</option>
              </select>
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} aria-label="Filter by topic">
                <option value="">All topics</option>
                {categories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>{category.name}</option>
                ))}
              </select>
            </div>
          </div>

          {error ? (
            <p className="form-error">{error}</p>
          ) : loading ? (
            <p className="admin-empty">Loading articles...</p>
          ) : (
            <div className="admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">ID</th>
                    <th scope="col">Title</th>
                    <th scope="col">Author</th>
                    <th scope="col">Topic</th>
                    <th scope="col">Date</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {articles.length ? articles.map((article) => (
                    <tr key={article.article_id}>
                      <td>A-{article.article_id}</td>
                      <td>{article.title}</td>
                      <td>@{article.author}</td>
                      <td>{article.category}</td>
                      <td>{new Date(article.created_at).toLocaleDateString()}</td>
                      <td><span className={`status-badge ${article.status}`}>{article.status}</span></td>
                    </tr>
                  )) : (
                    <tr>
                      <td className="admin-empty" colSpan={6}>No articles found for these filters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </section>
    </main>
  )
}

function Metric({ label, value, tone = 'default' }: { label: string; value: number; tone?: string }) {
  return (
    <article className={`admin-metric ${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

export default AdminDashboard
