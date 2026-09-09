const pool = require("../config/database");

// GET /api/articles/:articleId/comments
const getComments = async (req, res) => {
  try {
    const articleId = req.params.articleId;

    const [comments] = await pool.execute(
      `SELECT
        c.comment_id,
        c.article_id,
        c.user_id,
        c.comment_text,
        c.is_edited,
        c.created_at,
        c.updated_at,
        u.username,
        u.full_name
      FROM comments c
      JOIN users u
        ON c.user_id = u.user_id
      WHERE c.article_id = ?
      ORDER BY c.created_at ASC`,
      [articleId],
    );

    return res.status(200).json({
      comments,
    });
  } catch (error) {
    console.error(
      "Get comments error:",
      error,
    );

    return res.status(500).json({
      message:
        "Server error while fetching comments",
    });
  }
};


// POST /api/articles/:articleId/comments
const createComment = async (req, res) => {
  try {
    const articleId =
      req.params.articleId;

    const userId =
      req.user.user_id;

    const { comment_text } =
      req.body;

    if (
      !comment_text ||
      !comment_text.trim()
    ) {
      return res.status(400).json({
        message:
          "Comment cannot be empty",
      });
    }

    // Make sure the article exists
    // and is publicly published.
    const [articles] =
      await pool.execute(
        `SELECT article_id
         FROM articles
         WHERE article_id = ?
           AND status = 'published'`,
        [articleId],
      );

    if (articles.length === 0) {
      return res.status(404).json({
        message:
          "Article not found",
      });
    }

    const [result] =
      await pool.execute(
        `INSERT INTO comments
          (article_id, user_id, comment_text)
         VALUES (?, ?, ?)`,
        [
          articleId,
          userId,
          comment_text.trim(),
        ],
      );

    // Return the newly-created
    // comment with user information.
    const [comments] =
      await pool.execute(
        `SELECT
          c.comment_id,
          c.article_id,
          c.user_id,
          c.comment_text,
          c.is_edited,
          c.created_at,
          c.updated_at,
          u.username,
          u.full_name
        FROM comments c
        JOIN users u
          ON c.user_id = u.user_id
        WHERE c.comment_id = ?`,
        [result.insertId],
      );

    return res.status(201).json({
      message:
        "Comment posted successfully",

      comment: comments[0],
    });
  } catch (error) {
    console.error(
      "Create comment error:",
      error,
    );

    return res.status(500).json({
      message:
        "Server error while posting comment",
    });
  }
};

// PUT /api/comments/:commentId
const updateComment = async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const userId = req.user.user_id;
    const { comment_text } = req.body;

    if (
      !comment_text ||
      !comment_text.trim()
    ) {
      return res.status(400).json({
        message:
          "Comment cannot be empty",
      });
    }

    const [result] =
      await pool.execute(
        `UPDATE comments
         SET
           comment_text = ?,
           is_edited = 1,
           updated_at = CURRENT_TIMESTAMP
         WHERE comment_id = ?
           AND user_id = ?`,
        [
          comment_text.trim(),
          commentId,
          userId,
        ],
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message:
          "Comment not found",
      });
    }

    const [comments] =
      await pool.execute(
        `SELECT
          c.comment_id,
          c.article_id,
          c.user_id,
          c.comment_text,
          c.is_edited,
          c.created_at,
          c.updated_at,
          u.username,
          u.full_name
        FROM comments c
        JOIN users u
          ON c.user_id = u.user_id
        WHERE c.comment_id = ?`,
        [commentId],
      );

    return res.status(200).json({
      message:
        "Comment updated successfully",
      comment: comments[0],
    });
  } catch (error) {
    console.error(
      "Update comment error:",
      error,
    );

    return res.status(500).json({
      message:
        "Server error while updating comment",
    });
  }
};


// DELETE /api/comments/:commentId
const deleteComment = async (req, res) => {
  try {
    const commentId =
      req.params.commentId;

    const userId =
      req.user.user_id;

    const [result] =
      await pool.execute(
        `DELETE FROM comments
         WHERE comment_id = ?
           AND user_id = ?`,
        [
          commentId,
          userId,
        ],
      );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message:
          "Comment not found",
      });
    }

    return res.status(200).json({
      message:
        "Comment deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete comment error:",
      error,
    );

    return res.status(500).json({
      message:
        "Server error while deleting comment",
    });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
};