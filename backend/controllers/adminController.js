const pool = require('../config/database')

const getDashboard = async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  const status = typeof req.query.status === 'string' ? req.query.status : ''
  const categoryId = Number.parseInt(req.query.categoryId, 10)

  try {
    const [summaryRows] = await pool.execute(
      `SELECT
        COUNT(*) AS totalArticles,
        COALESCE(SUM(status = 'published'), 0) AS publishedArticles,
        COALESCE(SUM(status = 'draft'), 0) AS draftArticles,
        COALESCE(SUM(status = 'archived'), 0) AS archivedArticles
       FROM articles`,
    )

    const [categories] = await pool.execute(
      'SELECT category_id, name FROM categories ORDER BY name',
    )

    const filters = []
    const values = []

    if (search) {
      filters.push('(a.title LIKE ? OR u.username LIKE ?)')
      const searchTerm = `%${search}%`
      values.push(searchTerm, searchTerm)
    }

    if (['draft', 'published', 'archived', 'deleted'].includes(status)) {
      filters.push('a.status = ?')
      values.push(status)
    }

    if (Number.isInteger(categoryId)) {
      filters.push('a.category_id = ?')
      values.push(categoryId)
    }

    // Filter clauses are fixed server-side and values are parameterised to protect the query.
    const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : ''
    const [articles] = await pool.execute(
      `SELECT
        a.article_id,
        a.title,
        a.status,
        a.created_at,
        u.username AS author,
        c.name AS category
       FROM articles AS a
       JOIN users AS u ON u.user_id = a.author_id
       JOIN categories AS c ON c.category_id = a.category_id
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT 100`,
      values,
    )

    return res.json({
      summary: summaryRows[0],
      categories,
      articles,
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ message: 'Unable to load the admin dashboard' })
  }
}

module.exports = { getDashboard }
