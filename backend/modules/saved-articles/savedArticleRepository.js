const pool = require('../../config/database');

// SQL statements are isolated here, including statements used inside transactions.

const statement1 = (params, connection) => (connection || pool).execute(
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
  params,
);

const statement2 = (params, connection) => (connection || pool).execute(
  `SELECT article_id
         FROM saved_articles
         WHERE user_id = ?
           AND article_id = ?`,
  params,
);

const statement3 = (params, connection) => (connection || pool).execute(
  `SELECT article_id
       FROM articles
       WHERE article_id = ?
         AND status = 'published'`,
  params,
);

const statement4 = (params, connection) => (connection || pool).execute(
  `SELECT article_id
       FROM saved_articles
       WHERE user_id = ?
         AND article_id = ?`,
  params,
);

const statement5 = (params, connection) => (connection || pool).execute(
  `INSERT INTO saved_articles
        (user_id, article_id)
       VALUES (?, ?)`,
  params,
);

const statement6 = (params, connection) => (connection || pool).execute(
  `DELETE FROM saved_articles
       WHERE user_id = ?
         AND article_id = ?`,
  params,
);

const getConnection = () => pool.getConnection();

module.exports = { getConnection, statement1, statement2, statement3, statement4, statement5, statement6 };
