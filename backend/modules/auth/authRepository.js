const pool = require('../../config/database');

// SQL statements are isolated here, including statements used inside transactions.

const statement1 = (params, connection) => (connection || pool).execute(
  `
        SELECT user_id
        FROM users
        WHERE username = ?
           OR email = ?
        `,
  params,
);

const statement2 = (params, connection) => (connection || pool).execute(
  `
      INSERT INTO users (
        username,
        email,
        password_hash,
        full_name
      )
      VALUES (?, ?, ?, ?)
      `,
  params,
);

const statement3 = (params, connection) => (connection || pool).execute(
  `
        SELECT *
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
  params,
);

const statement4 = (params, connection) => (connection || pool).execute(
  `
        SELECT *
        FROM users
        WHERE email = ?
        LIMIT 1
        `,
  params,
);

const getConnection = () => pool.getConnection();

module.exports = { getConnection, statement1, statement2, statement3, statement4 };
