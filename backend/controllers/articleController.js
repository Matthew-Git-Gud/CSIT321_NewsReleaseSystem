const pool = require('../config/database')

// POST /api/articles
const createArticle = async (req, res) => {
  try {
    const {
      title,
      summary,
      content,
      category_id,
      status,
    } = req.body

    const authorId = req.user.user_id

    if (!title || !summary || !content || !category_id) {
      return res.status(400).json({
        message: 'Title, summary, content and category are required',
      })
    }

    const allowedStatuses = ['draft', 'published']

    const articleStatus = allowedStatuses.includes(status)
      ? status
      : 'draft'

    const [categories] = await pool.execute(
      `SELECT category_id
       FROM categories
       WHERE category_id = ?`,
      [category_id],
    )

    if (categories.length === 0) {
      return res.status(400).json({
        message: 'Invalid category',
      })
    }

    const [result] = await pool.execute(
      `INSERT INTO articles
       (
         author_id,
         category_id,
         title,
         summary,
         content,
         status
       )
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        authorId,
        category_id,
        title.trim(),
        summary.trim(),
        content.trim(),
        articleStatus,
      ],
    )

    const [articles] = await pool.execute(
      `SELECT
         a.article_id,
         a.author_id,
         a.title,
         a.summary,
         a.content,
         a.status,
         a.created_at,
         a.updated_at,
         c.category_id,
         c.name AS category
       FROM articles a
       JOIN categories c
         ON a.category_id = c.category_id
       WHERE a.article_id = ?`,
      [result.insertId],
    )

    return res.status(201).json({
      message:
        articleStatus === 'published'
          ? 'Article published successfully'
          : 'Draft saved successfully',
      article: articles[0],
    })
  } catch (error) {
    console.error('Create article error:', error)

    return res.status(500).json({
      message: 'Server error while creating article',
    })
  }
}
// GET /api/articles/mine
const getMyArticles = async (req, res) => {
  try {
    const authorId = req.user.user_id;

    const [articles] = await pool.execute(
      `SELECT
        a.article_id,
        a.author_id,
        a.title,
        a.summary,
        a.status,
        a.created_at,
        a.updated_at,
        c.category_id,
        c.name AS category
      FROM articles a
      JOIN categories c
        ON a.category_id = c.category_id
      WHERE a.author_id = ?
        AND a.status != 'deleted'
      ORDER BY a.updated_at DESC`,
      [authorId],
    );

    return res.status(200).json({
      articles,
    });
  } catch (error) {
    console.error("Get my articles error:", error);

    return res.status(500).json({
      message: "Server error while fetching articles",
    });
  }
};

// DELETE /api/articles/:id
const deleteArticle = async (req, res) => {
  try {
    const articleId = req.params.id;
    const authorId = req.user.user_id;

    const [result] = await pool.execute(
      `UPDATE articles
       SET status = 'deleted'
       WHERE article_id = ?
         AND author_id = ?
         AND status != 'deleted'`,
      [articleId, authorId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    return res.status(200).json({
      message: "Article deleted successfully",
    });
  } catch (error) {
    console.error("Delete article error:", error);

    return res.status(500).json({
      message: "Server error while deleting article",
    });
  }
};
// GET /api/articles/:id/edit
const getArticleForEdit = async (req, res) => {
  try {
    const articleId = req.params.id;
    const authorId = req.user.user_id;

    const [articles] = await pool.execute(
      `SELECT
        a.article_id,
        a.author_id,
        a.category_id,
        a.title,
        a.summary,
        a.content,
        a.status,
        a.created_at,
        a.updated_at,
        c.name AS category
      FROM articles a
      JOIN categories c
        ON a.category_id = c.category_id
      WHERE a.article_id = ?
        AND a.author_id = ?
        AND a.status != 'deleted'`,
      [articleId, authorId],
    );

    if (articles.length === 0) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    return res.status(200).json({
      article: articles[0],
    });
  } catch (error) {
    console.error("Get article for edit error:", error);

    return res.status(500).json({
      message: "Server error while fetching article",
    });
  }
};


// PUT /api/articles/:id
const updateArticle = async (req, res) => {
  try {
    const articleId = req.params.id;
    const authorId = req.user.user_id;

    const {
      title,
      summary,
      content,
      category_id,
      status,
    } = req.body;

    if (
      !title ||
      !summary ||
      !content ||
      !category_id
    ) {
      return res.status(400).json({
        message:
          "Title, summary, content and category are required",
      });
    }

    const allowedStatuses = [
      "draft",
      "published",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid article status",
      });
    }

    const [categories] = await pool.execute(
      `SELECT category_id
       FROM categories
       WHERE category_id = ?`,
      [category_id],
    );

    if (categories.length === 0) {
      return res.status(400).json({
        message: "Invalid category",
      });
    }

    const [result] = await pool.execute(
      `UPDATE articles
       SET
         title = ?,
         summary = ?,
         content = ?,
         category_id = ?,
         status = ?
       WHERE article_id = ?
         AND author_id = ?
         AND status != 'deleted'`,
      [
        title.trim(),
        summary.trim(),
        content.trim(),
        category_id,
        status,
        articleId,
        authorId,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    return res.status(200).json({
      message: "Article updated successfully",
    });
  } catch (error) {
    console.error("Update article error:", error);

    return res.status(500).json({
      message: "Server error while updating article",
    });
  }
};

// GET /api/articles/:id
const getArticleById = async (req, res) => {
  try {
    const articleId = req.params.id;

    const [articles] = await pool.execute(
      `SELECT
        a.article_id,
        a.author_id,
        a.category_id,
        a.title,
        a.summary,
        a.content,
        a.status,
        a.created_at,
        a.updated_at,
        c.name AS category,
        u.username AS author_username,
        u.full_name AS author_name
      FROM articles a
      JOIN categories c
        ON a.category_id = c.category_id
      JOIN users u
        ON a.author_id = u.user_id
      WHERE a.article_id = ?
        AND a.status = 'published'`,
      [articleId],
    );

    if (articles.length === 0) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    return res.status(200).json({
      article: articles[0],
    });
  } catch (error) {
    console.error("Get article error:", error);

    return res.status(500).json({
      message: "Server error while fetching article",
    });
  }
};

// GET /api/articles
const getPublishedArticles = async (req, res) => {
  try {
    const [articles] = await pool.execute(
      `SELECT
        a.article_id,
        a.author_id,
        a.category_id,
        a.title,
        a.summary,
        a.created_at,
        a.updated_at,
        c.name AS category,
        u.username AS author_username,
        u.full_name AS author_name
      FROM articles a
      JOIN categories c
        ON a.category_id = c.category_id
      JOIN users u
        ON a.author_id = u.user_id
      WHERE a.status = 'published'
      ORDER BY a.created_at DESC`,
    );

    return res.status(200).json({
      articles,
    });
  } catch (error) {
    console.error(
      "Get published articles error:",
      error,
    );

    return res.status(500).json({
      message:
        "Server error while fetching articles",
    });
  }
};

const getPersonalisedFeed = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const [articles] = await pool.query(
      `
      SELECT
        a.article_id,
        a.title,
        a.summary,
        a.content,
        a.status,
        a.created_at,
        a.updated_at,
        c.category_id,
        c.name AS category,
        u.username AS author,
        u.full_name AS author_name
      FROM articles a
      JOIN categories c
        ON a.category_id = c.category_id
      JOIN users u
        ON a.author_id = u.user_id
      JOIN user_preferred_categories upc
        ON a.category_id = upc.category_id
      WHERE upc.user_id = ?
        AND a.status = 'published'
      ORDER BY a.created_at DESC
      `,
      [userId]
    );

    return res.status(200).json({
      articles,
    });
  } catch (error) {
    console.error(
      "Get personalised feed error:",
      error
    );

    return res.status(500).json({
      message: "Unable to load personalised feed",
    });
  }
};

module.exports = {
  createArticle,
  getMyArticles,
  getArticleById,
  getArticleForEdit,
  updateArticle,
  deleteArticle,
  getPublishedArticles,
  getPersonalisedFeed,
};