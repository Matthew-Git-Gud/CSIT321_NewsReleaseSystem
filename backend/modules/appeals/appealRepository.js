const pool = require('../../config/database');

// SQL statements are isolated here, including statements used inside transactions.

const statement1 = (params, connection) => (connection || pool).query(
  `
        SELECT
          user_id,
          status
        FROM users
        WHERE user_id = ?
        LIMIT 1
        `,
  params,
);

const statement2 = (params, connection) => (connection || pool).query(
  `
        SELECT appeal_id
        FROM suspension_appeals
        WHERE user_id = ?
          AND status = 'pending'
        LIMIT 1
        `,
  params,
);

const statement3 = (params, connection) => (connection || pool).query(
  `
        INSERT INTO suspension_appeals (
          user_id,
          reason
        )
        VALUES (?, ?)
        `,
  params,
);

const statement4 = (params, connection) => (connection || pool).query(
  `
        SELECT
          sa.appeal_id,
          sa.user_id,
          sa.reason,
          sa.status,
          sa.submitted_at,

          u.username,
          u.full_name,
          u.email

        FROM suspension_appeals sa

        JOIN users u
          ON u.user_id = sa.user_id

        WHERE sa.status = 'pending'

        ORDER BY
          sa.submitted_at ASC
        `,
  params,
);

const statement5 = (params, connection) => (connection || pool).query(
  `
        SELECT
          appeal_id,
          user_id,
          status
        FROM suspension_appeals
        WHERE appeal_id = ?
        FOR UPDATE
        `,
  params,
);

const statement6 = (params, connection) => (connection || pool).query(
  `
      UPDATE suspension_appeals
      SET
        status = ?,
        reviewed_at =
          CURRENT_TIMESTAMP,
        reviewed_by = ?,
        admin_response = ?
      WHERE appeal_id = ?
      `,
  params,
);

const statement7 = (params, connection) => (connection || pool).query(
  `
        UPDATE users
        SET status = 'active'
        WHERE user_id = ?
        `,
  params,
);

const getConnection = () => pool.getConnection();

module.exports = { getConnection, statement1, statement2, statement3, statement4, statement5, statement6, statement7 };
