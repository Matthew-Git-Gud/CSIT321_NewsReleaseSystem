const pool = require(
  "../config/database",
);

const getDashboard = async (
  req,
  res,
) => {
  const search =
    typeof req.query.search === "string"
      ? req.query.search.trim()
      : "";

  const status =
    typeof req.query.status === "string"
      ? req.query.status
      : "";

  const categoryId =
    Number.parseInt(
      req.query.categoryId,
      10,
    );

  try {
    // =========================
    // DASHBOARD SUMMARY
    // =========================

    const [summaryRows] =
      await pool.execute(
        `SELECT
          COUNT(*) AS totalArticles,

          COALESCE(
            SUM(status = 'published'),
            0
          ) AS publishedArticles,

          COALESCE(
            SUM(status = 'draft'),
            0
          ) AS draftArticles,

          COALESCE(
            SUM(status = 'deleted'),
            0
          ) AS deletedArticles

        FROM articles`,
      );

    // =========================
    // CATEGORIES
    // =========================

    const [categories] =
      await pool.execute(
        `SELECT
          category_id,
          name
        FROM categories
        ORDER BY name`,
      );

    // =========================
    // FILTERS
    // =========================

    const filters = [];
    const values = [];

    if (search) {
      filters.push(
        `(a.title LIKE ?
          OR u.username LIKE ?
          OR u.full_name LIKE ?)`,
      );

      const searchTerm =
        `%${search}%`;

      values.push(
        searchTerm,
        searchTerm,
        searchTerm,
      );
    }

    if (
      [
        "draft",
        "published",
        "deleted",
      ].includes(status)
    ) {
      filters.push(
        "a.status = ?",
      );

      values.push(status);
    }

    if (
      Number.isInteger(categoryId)
    ) {
      filters.push(
        "a.category_id = ?",
      );

      values.push(categoryId);
    }

    const whereClause =
      filters.length > 0
        ? `WHERE ${filters.join(
            " AND ",
          )}`
        : "";

    // =========================
    // ARTICLES
    // =========================

    const [articles] =
      await pool.execute(
        `SELECT
          a.article_id,
          a.title,
          a.status,
          a.created_at,
          u.username AS author,
          u.full_name AS author_name,
          c.name AS category

        FROM articles a

        JOIN users u
          ON u.user_id =
             a.author_id

        JOIN categories c
          ON c.category_id =
             a.category_id

        ${whereClause}

        ORDER BY a.created_at DESC

        LIMIT 100`,
        values,
      );

    return res.status(200).json({
      summary:
        summaryRows[0],

      categories,
      articles,
    });
  } catch (error) {
    console.error(
      "Admin dashboard error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to load the admin dashboard",
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const search =
      req.query.search?.trim() || "";

    let sql = `
      SELECT
        user_id,
        username,
        email,
        full_name,
        role,
        status,
        created_at
      FROM users
    `;

    const params = [];

    if (search) {
      sql += `
        WHERE
          username LIKE ?
          OR email LIKE ?
          OR full_name LIKE ?
      `;

      const searchValue = `%${search}%`;

      params.push(
        searchValue,
        searchValue,
        searchValue,
      );
    }

    sql += `
      ORDER BY created_at DESC
    `;

    const [users] =
      await pool.query(
        sql,
        params,
      );

    return res.status(200).json({
      users,
    });
  } catch (error) {
    console.error(
      "Get users error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to load users",
    });
  }
};


const updateUserStatus = async (
  req,
  res,
) => {
  try {
    const userId =
      Number(req.params.userId);

    const { status } = req.body;

    if (
      ![
        "active",
        "suspended",
      ].includes(status)
    ) {
      return res.status(400).json({
        message:
          "Invalid account status",
      });
    }

    if (
      userId === req.user.user_id
    ) {
      return res.status(400).json({
        message:
          "You cannot suspend your own account",
      });
    }

    const [users] =
      await pool.query(
        `
        SELECT
          user_id,
          role,
          status
        FROM users
        WHERE user_id = ?
        `,
        [userId],
      );

    if (users.length === 0) {
      return res.status(404).json({
        message:
          "User not found",
      });
    }

    /*
     * Prevent one administrator
     * from suspending another
     * administrator.
     */
    if (
      users[0].role === "admin"
    ) {
      return res.status(403).json({
        message:
          "Administrator accounts cannot be suspended",
      });
    }

    await pool.query(
      `
      UPDATE users
      SET status = ?
      WHERE user_id = ?
      `,
      [
        status,
        userId,
      ],
    );

    return res.status(200).json({
      message:
        status === "suspended"
          ? "User suspended successfully"
          : "User reactivated successfully",

      user: {
        user_id: userId,
        status,
      },
    });
  } catch (error) {
    console.error(
      "Update user status error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to update user status",
    });
  }
};

const deleteArticleAsAdmin = async (req, res) => {
  try {
    const articleId =
      Number(req.params.articleId);

    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid article ID",
      });
    }

    const [articles] = await pool.query(
      `
      SELECT
        article_id,
        title,
        status
      FROM articles
      WHERE article_id = ?
      `,
      [articleId],
    );

    if (articles.length === 0) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    if (
      articles[0].status === "deleted"
    ) {
      return res.status(400).json({
        message:
          "Article is already deleted",
      });
    }

    await pool.query(
      `
      UPDATE articles
      SET status = 'deleted'
      WHERE article_id = ?
      `,
      [articleId],
    );

    return res.status(200).json({
      message:
        "Article deleted successfully",
    });
  } catch (error) {
    console.error(
      "Admin delete article error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to delete article",
    });
  }
};

const getArticleForAdminEdit = async (
  req,
  res,
) => {
  try {
    const articleId =
      Number(req.params.articleId);

    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid article ID",
      });
    }

    const [articles] =
      await pool.query(
        `
        SELECT
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
          u.username AS author,
          u.full_name AS author_name
        FROM articles a
        JOIN categories c
          ON a.category_id = c.category_id
        JOIN users u
          ON a.author_id = u.user_id
        WHERE a.article_id = ?
        `,
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
    console.error(
      "Admin get article error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to load article",
    });
  }
};

const updateArticleAsAdmin = async (
  req,
  res,
) => {
  try {
    const articleId =
      Number(req.params.articleId);

    const {
      title,
      summary,
      content,
      category_id,
      status,
    } = req.body;

    if (
      !Number.isInteger(articleId) ||
      articleId <= 0
    ) {
      return res.status(400).json({
        message: "Invalid article ID",
      });
    }

    if (
      !title?.trim() ||
      !summary?.trim() ||
      !content?.trim() ||
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

    if (
      !allowedStatuses.includes(status)
    ) {
      return res.status(400).json({
        message:
          "Invalid article status",
      });
    }

    const [articles] =
      await pool.query(
        `
        SELECT
          article_id,
          status
        FROM articles
        WHERE article_id = ?
        `,
        [articleId],
      );

    if (articles.length === 0) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    if (
      articles[0].status ===
      "deleted"
    ) {
      return res.status(400).json({
        message:
          "Deleted articles cannot be edited",
      });
    }

    const [categories] =
      await pool.query(
        `
        SELECT category_id
        FROM categories
        WHERE category_id = ?
        `,
        [category_id],
      );

    if (
      categories.length === 0
    ) {
      return res.status(400).json({
        message:
          "Invalid category",
      });
    }

    await pool.query(
      `
      UPDATE articles
      SET
        title = ?,
        summary = ?,
        content = ?,
        category_id = ?,
        status = ?
      WHERE article_id = ?
      `,
      [
        title.trim(),
        summary.trim(),
        content.trim(),
        category_id,
        status,
        articleId,
      ],
    );

    const [updatedArticles] =
      await pool.query(
        `
        SELECT
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
          u.username AS author,
          u.full_name AS author_name
        FROM articles a
        JOIN categories c
          ON a.category_id =
             c.category_id
        JOIN users u
          ON a.author_id =
             u.user_id
        WHERE a.article_id = ?
        `,
        [articleId],
      );

    return res.status(200).json({
      message:
        "Article updated successfully",
      article:
        updatedArticles[0],
    });
  } catch (error) {
    console.error(
      "Admin update article error:",
      error,
    );

    return res.status(500).json({
      message:
        "Unable to update article",
    });
  }
};

module.exports = {
  getDashboard,
  getUsers,
  updateUserStatus,
  deleteArticleAsAdmin,
  getArticleForAdminEdit,
  updateArticleAsAdmin,
};