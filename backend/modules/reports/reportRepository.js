const pool = require('../../config/database');

// SQL statements are isolated here, including statements used inside transactions.

const statement1 = (params, connection) => (connection || pool).query(
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

const statement2 = (params, connection) => (connection || pool).query(
  `
        SELECT report_id
        FROM article_reports
        WHERE article_id = ?
          AND reporter_id = ?
          AND status = 'pending'
        LIMIT 1
        `,
  params,
);

const statement3 = (params, connection) => (connection || pool).query(
  `
        INSERT INTO article_reports (
          article_id,
          reporter_id,
          reason,
          details
        )
        VALUES (?, ?, ?, ?)
        `,
  params,
);

const statement4 = (params, connection) => (connection || pool).query(
  `
        SELECT
          article_id,
          author_id
        FROM articles
        WHERE article_id = ?
        `,
  params,
);

const statement5 = (params, connection) => (connection || pool).query(
  `
        SELECT report_id
        FROM article_reports
        WHERE article_id = ?
          AND reporter_id = ?
          AND status = 'pending'
        LIMIT 1
        `,
  params,
);

const statement6 = (params, connection) => (connection || pool).query(
  `
        SELECT
          ar.report_id,
          ar.article_id,
          ar.reporter_id,
          ar.reason,
          ar.details,
          ar.status,
          ar.created_at,

          a.title AS article_title,
          a.author_id,

          reporter.username AS reporter_username,
          reporter.full_name AS reporter_name,

          author.username AS author_username,
          author.full_name AS author_name

        FROM article_reports ar

        JOIN articles a
          ON ar.article_id = a.article_id

        JOIN users reporter
          ON ar.reporter_id = reporter.user_id

        JOIN users author
          ON a.author_id = author.user_id

        WHERE ar.status = 'pending'

        ORDER BY ar.created_at DESC
        `,
  params,
);

const statement7 = (params, connection) => (connection || pool).query(
  `
        SELECT
          report_id,
          article_id,
          status
        FROM article_reports
        WHERE report_id = ?
        FOR UPDATE
        `,
  params,
);

const statement8 = (params, connection) => (connection || pool).query(
  `
      UPDATE article_reports
      SET
        status = ?,
        reviewed_at = CURRENT_TIMESTAMP,
        reviewed_by = ?
      WHERE report_id = ?
      `,
  params,
);

const statement9 = (params, connection) => (connection || pool).query(
  `
        UPDATE articles
        SET
          status = 'deleted',
          updated_at = CURRENT_TIMESTAMP
        WHERE article_id = ?
          AND status != 'deleted'
        `,
  params,
);

const getConnection = () => pool.getConnection();

module.exports = { getConnection, statement1, statement2, statement3, statement4, statement5, statement6, statement7, statement8, statement9 };
