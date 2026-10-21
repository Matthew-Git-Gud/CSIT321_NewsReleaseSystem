const pool = require('../../config/database');

// SQL statements are isolated here, including statements used inside transactions.

const statement1 = (params, connection) => (connection || pool).execute(
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
  params,
);

const statement2 = (params, connection) => (connection || pool).execute(
  `SELECT
          category_id,
          name
        FROM categories
        ORDER BY name`,
  params,
);

const statement3 = (params, connection, { whereClause } = {}) => (connection || pool).execute(
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
  params,
);

const statement4 = (params, connection) => (connection || pool).query(
  `
        SELECT
          user_id,
          role,
          status
        FROM users
        WHERE user_id = ?
        `,
  params,
);

const statement5 = (params, connection) => (connection || pool).query(
  `
      UPDATE users
      SET status = ?
      WHERE user_id = ?
      `,
  params,
);

const statement6 = (params, connection) => (connection || pool).query(
  `
      SELECT
        article_id,
        title,
        status
      FROM articles
      WHERE article_id = ?
      `,
  params,
);

const statement7 = (params, connection) => (connection || pool).query(
  `
      UPDATE articles
      SET status = 'deleted'
      WHERE article_id = ?
      `,
  params,
);

const statement8 = (params, connection) => (connection || pool).query(
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
  params,
);

const statement9 = (params, connection) => (connection || pool).query(
  `
        SELECT
          article_id,
          status
        FROM articles
        WHERE article_id = ?
        `,
  params,
);

const statement10 = (params, connection) => (connection || pool).query(
  `
        SELECT category_id
        FROM categories
        WHERE category_id = ?
        `,
  params,
);

const statement11 = (params, connection) => (connection || pool).query(
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
  params,
);

const statement12 = (params, connection) => (connection || pool).query(
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
  params,
);

const getConnection = () => pool.getConnection();

const queryUsers = (sql, params) => pool.query(sql, params);

module.exports = { queryUsers, getConnection, statement1, statement2, statement3, statement4, statement5, statement6, statement7, statement8, statement9, statement10, statement11, statement12 };
