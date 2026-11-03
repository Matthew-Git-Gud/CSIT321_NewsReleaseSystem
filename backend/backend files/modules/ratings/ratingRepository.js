const pool = require('../../config/database');

// SQL statements are isolated here, including statements used inside transactions.

const statement1 = (params, connection) => (connection || pool).query(
  `
        SELECT
          article_id,
          status
        FROM articles
        WHERE article_id = ?
        `,
  params,
);

const statement2 = (params, connection) => (connection || pool).query(
  `
        SELECT
          ROUND(
            AVG(rating),
            1
          ) AS average_rating,
          COUNT(*) AS rating_count
        FROM article_ratings
        WHERE article_id = ?
        `,
  params,
);

const statement3 = (params, connection) => (connection || pool).query(
  `
          SELECT rating
          FROM article_ratings
          WHERE article_id = ?
            AND user_id = ?
          LIMIT 1
          `,
  params,
);

const statement4 = (params, connection) => (connection || pool).query(
  `
        SELECT
          article_id,
          author_id,
          status
        FROM articles
        WHERE article_id = ?
        `,
  params,
);

const statement5 = (params, connection) => (connection || pool).query(
  `
      INSERT INTO article_ratings (
        article_id,
        user_id,
        rating
      )
      VALUES (?, ?, ?)

      ON DUPLICATE KEY UPDATE
        rating = VALUES(rating),
        updated_at =
          CURRENT_TIMESTAMP
      `,
  params,
);

const statement6 = (params, connection) => (connection || pool).query(
  `
        SELECT
          ROUND(
            AVG(rating),
            1
          ) AS average_rating,
          COUNT(*) AS rating_count
        FROM article_ratings
        WHERE article_id = ?
        `,
  params,
);

const getConnection = () => pool.getConnection();

module.exports = { getConnection, statement1, statement2, statement3, statement4, statement5, statement6 };
