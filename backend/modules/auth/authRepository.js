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
        SELECT u.*, COALESCE(up.accent_colour, 'emerald') AS accent_colour
        FROM users AS u
        LEFT JOIN user_preferences AS up ON up.user_id = u.user_id
        WHERE u.email = ?
        LIMIT 1
        `,
  params,
);

const statement4 = (params, connection) => (connection || pool).execute(
  `
        SELECT u.*, COALESCE(up.accent_colour, 'emerald') AS accent_colour
        FROM users AS u
        LEFT JOIN user_preferences AS up ON up.user_id = u.user_id
        WHERE u.email = ?
        LIMIT 1
        `,
  params,
);

const getConnection = () => pool.getConnection();

module.exports = { getConnection, statement1, statement2, statement3, statement4 };
