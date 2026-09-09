const pool = require("../config/database");

// ========================================
// GET /api/saved-articles
// ========================================

const getSavedArticles = async (req, res) => {
  try {
    const userId = req.user.user_id;

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
        u.full_name AS author_name,
        sa.saved_at
      FROM saved_articles sa
      JOIN articles a
        ON sa.article_id = a.article_id
      JOIN categories c
        ON a.category_id = c.category_id
      JOIN users u
        ON a.author_id = u.user_id
      WHERE sa.user_id = ?
        AND a.status = 'published'
      ORDER BY sa.saved_at DESC`,
      [userId],
    );

    return res.status(200).json({
      articles,
    });
  } catch (error) {
    console.error(
      "Get saved articles error:",
      error,
    );

    return res.status(500).json({
      message:
        "Server error while fetching saved articles",
    });
  }
};


// ========================================
// GET /api/articles/:articleId/saved
// ========================================

const getSavedStatus = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const articleId = req.params.articleId;

    const [savedArticles] =
      await pool.execute(
        `SELECT article_id
         FROM saved_articles
         WHERE user_id = ?
           AND article_id = ?`,
        [userId, articleId],
      );

    return res.status(200).json({
      saved:
        savedArticles.length > 0,
    });
  } catch (error) {
    console.error(
      "Get saved status error:",
      error,
    );

    return res.status(500).json({
      message:
        "Server error while checking saved article",
    });
  }
};


// ========================================
// POST /api/articles/:articleId/save
// ========================================

const saveArticle = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const articleId = req.params.articleId;

    // Only published articles can be saved.
    const [articles] = await pool.execute(
      `SELECT article_id
       FROM articles
       WHERE article_id = ?
         AND status = 'published'`,
      [articleId],
    );

    if (articles.length === 0) {
      return res.status(404).json({
        message: "Article not found",
      });
    }

    // Check whether already saved.
    const [existing] = await pool.execute(
      `SELECT article_id
       FROM saved_articles
       WHERE user_id = ?
         AND article_id = ?`,
      [userId, articleId],
    );

    if (existing.length > 0) {
      return res.status(200).json({
        message: "Article already saved",
        saved: true,
      });
    }

    await pool.execute(
      `INSERT INTO saved_articles
        (user_id, article_id)
       VALUES (?, ?)`,
      [userId, articleId],
    );

    return res.status(201).json({
      message:
        "Article saved successfully",
      saved: true,
    });
  } catch (error) {
    console.error(
      "Save article error:",
      error,
    );

    return res.status(500).json({
      message:
        "Server error while saving article",
    });
  }
};


// ========================================
// DELETE /api/articles/:articleId/save
// ========================================

const unsaveArticle = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const articleId = req.params.articleId;

    await pool.execute(
      `DELETE FROM saved_articles
       WHERE user_id = ?
         AND article_id = ?`,
      [userId, articleId],
    );

    return res.status(200).json({
      message:
        "Article removed from saved articles",
      saved: false,
    });
  } catch (error) {
    console.error(
      "Unsave article error:",
      error,
    );

    return res.status(500).json({
      message:
        "Server error while removing saved article",
    });
  }
};

module.exports = {
  getSavedArticles,
  getSavedStatus,
  saveArticle,
  unsaveArticle,
};