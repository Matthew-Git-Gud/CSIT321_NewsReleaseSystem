const pool = require('../../config/database');

// SQL statements are isolated here, including statements used inside transactions.

const statement1 = (params, connection) => (connection || pool).execute(
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
  params,
);

const statement2 = (params, connection) => (connection || pool).execute(
  `SELECT article_id
         FROM articles
         WHERE article_id = ?
           AND status = 'published'`,
  params,
);

const statement3 = (params, connection) => (connection || pool).execute(
  `INSERT INTO comments
          (article_id, user_id, comment_text)
         VALUES (?, ?, ?)`,
  params,
);

const statement4 = (params, connection) => (connection || pool).execute(
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
  params,
);

const statement5 = (params, connection) => (connection || pool).execute(
  `UPDATE comments
         SET
           comment_text = ?,
           is_edited = 1,
           updated_at = CURRENT_TIMESTAMP
         WHERE comment_id = ?
           AND user_id = ?`,
  params,
);

const statement6 = (params, connection) => (connection || pool).execute(
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
  params,
);

const statement7 = (params, connection) => (connection || pool).execute(
  `DELETE FROM comments
         WHERE comment_id = ?
           AND user_id = ?`,
  params,
);

const getConnection = () => pool.getConnection();

module.exports = { getConnection, statement1, statement2, statement3, statement4, statement5, statement6, statement7 };
